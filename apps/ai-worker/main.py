"""
Creo AI worker — FastAPI sidecar for the Node BullMQ video-analysis processor.

Endpoints are intentionally stateless and idempotent: the Node worker downloads
a presigned MinIO URL (passed in the body) to /tmp, runs the requested analysis,
and returns JSON. No DB, no queue, no retries — that's all on the Node side.

Model weights are loaded lazily on first request and cached in memory so
subsequent requests reuse them. The whisper model size is configurable via
WHISPER_MODEL env var (default: base) so you can trade quality for memory.
"""

from __future__ import annotations

import logging
import os
import tempfile
from contextlib import asynccontextmanager
from typing import Any

import cv2
import httpx
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from scenedetect import SceneManager, open_video
from scenedetect.detectors import ContentDetector

logger = logging.getLogger("ai-worker")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

# Lazy model cache — created on first use, held for the process lifetime.
_whisper_model: Any = None
_mp_face_detector: Any = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("ai-worker starting up")
    yield
    logger.info("ai-worker shutting down")


app = FastAPI(title="Creo AI Worker", version="0.1.0", lifespan=lifespan)


class AnalyzeRequest(BaseModel):
    source_url: str = Field(..., description="Presigned GET URL to the video file")


class Shot(BaseModel):
    index: int
    start_ms: int
    end_ms: int
    thumbnail_b64: str | None = None


class ScenesResponse(BaseModel):
    shots: list[Shot]


class TranscriptSegmentDto(BaseModel):
    index: int
    start_ms: int
    end_ms: int
    text: str


class TranscribeResponse(BaseModel):
    language: str | None
    segments: list[TranscriptSegmentDto]


class FaceDto(BaseModel):
    start_ms: int
    end_ms: int
    face_count: int
    bbox_x: float
    bbox_y: float
    bbox_w: float
    bbox_h: float


class FacesResponse(BaseModel):
    detections: list[FaceDto]


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


async def _download_to_tmp(url: str, suffix: str = ".mp4") -> str:
    """Download a presigned URL to a temp file, return the path."""
    async with httpx.AsyncClient(timeout=300.0) as client:
        async with client.stream("GET", url) as response:
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502,
                    detail=f"Source returned {response.status_code}",
                )
            fd, path = tempfile.mkstemp(suffix=suffix, prefix="creo-ai-")
            try:
                with os.fdopen(fd, "wb") as f:
                    async for chunk in response.aiter_bytes(1 << 20):
                        f.write(chunk)
            except Exception:
                os.unlink(path)
                raise
            return path


@app.post("/scenes", response_model=ScenesResponse)
async def scenes(req: AnalyzeRequest) -> ScenesResponse:
    """
    Detect shot boundaries with PySceneDetect (ContentDetector, default
    threshold). For each shot we also extract a representative frame from
    ~25% into the shot (avoids fade-in artifacts on the first frame),
    downscale to 240px wide, JPEG-encode at Q=72, and return as base64.
    The Node worker uploads those thumbnails to MinIO so the UI can show
    actual previews instead of bare timecodes.
    """
    import base64

    path = await _download_to_tmp(req.source_url)
    try:
        video = open_video(path)
        scene_manager = SceneManager()
        scene_manager.add_detector(ContentDetector(threshold=27.0))
        scene_manager.detect_scenes(video, show_progress=False)
        scene_list = scene_manager.get_scene_list()

        cap = cv2.VideoCapture(path)
        shots: list[Shot] = []
        for idx, (start, end) in enumerate(scene_list):
            start_ms = int(start.get_seconds() * 1000)
            end_ms = int(end.get_seconds() * 1000)
            sample_ms = start_ms + max(100, (end_ms - start_ms) // 4)
            thumb_b64: str | None = None
            try:
                cap.set(cv2.CAP_PROP_POS_MSEC, sample_ms)
                ok, frame = cap.read()
                if ok and frame is not None:
                    h, w = frame.shape[:2]
                    target_w = 240
                    if w > target_w:
                        scale = target_w / w
                        frame = cv2.resize(
                            frame,
                            (target_w, max(1, int(h * scale))),
                            interpolation=cv2.INTER_AREA,
                        )
                    encoded_ok, buf = cv2.imencode(
                        ".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 72]
                    )
                    if encoded_ok:
                        thumb_b64 = base64.b64encode(buf.tobytes()).decode("ascii")
            except Exception as err:
                logger.warning("thumbnail extract failed shot=%d: %s", idx, err)
            shots.append(
                Shot(
                    index=idx,
                    start_ms=start_ms,
                    end_ms=end_ms,
                    thumbnail_b64=thumb_b64,
                )
            )
        cap.release()
        logger.info("scenes: detected %d shots for %s", len(shots), req.source_url[:80])
        return ScenesResponse(shots=shots)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def _whisper_enabled() -> bool:
    return os.environ.get("WHISPER_MODEL", "base").lower() not in ("", "none", "off", "disabled")


def _get_whisper() -> Any:
    global _whisper_model
    if _whisper_model is None:
        from faster_whisper import WhisperModel

        size = os.environ.get("WHISPER_MODEL", "base")
        compute = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")
        logger.info("loading whisper model=%s compute=%s", size, compute)
        _whisper_model = WhisperModel(size, device="cpu", compute_type=compute)
    return _whisper_model


@app.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(req: AnalyzeRequest) -> TranscribeResponse:
    """
    Transcribe audio with faster-whisper. Returns per-segment timestamps (ms)
    and text. Language is auto-detected.

    Disabled by default via WHISPER_MODEL=none (fast, zero-cost stub). Set
    WHISPER_MODEL=base or similar to re-enable.
    """
    if not _whisper_enabled():
        logger.info("transcribe: whisper disabled (WHISPER_MODEL=none), returning empty")
        return TranscribeResponse(language=None, segments=[])

    path = await _download_to_tmp(req.source_url)
    try:
        model = _get_whisper()
        segments_iter, info = model.transcribe(
            path,
            beam_size=1,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": 500},
        )

        result: list[TranscriptSegmentDto] = []
        for idx, seg in enumerate(segments_iter):
            text = seg.text.strip()
            if not text:
                continue
            result.append(
                TranscriptSegmentDto(
                    index=idx,
                    start_ms=int(seg.start * 1000),
                    end_ms=int(seg.end * 1000),
                    text=text,
                )
            )
        logger.info(
            "transcribe: %d segments, language=%s for %s",
            len(result),
            info.language,
            req.source_url[:80],
        )
        return TranscribeResponse(language=info.language, segments=result)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def _get_face_detector() -> Any:
    global _mp_face_detector
    if _mp_face_detector is None:
        logger.info("loading mediapipe face detector")
        _mp_face_detector = mp.solutions.face_detection.FaceDetection(
            model_selection=1, min_detection_confidence=0.5
        )
    return _mp_face_detector


@app.post("/faces", response_model=FacesResponse)
async def faces(req: AnalyzeRequest) -> FacesResponse:
    """
    Sample one frame per second, run mediapipe face detection. For each
    detected frame emit a per-second record with the largest face's bbox
    (normalized 0..1). Node side can collapse these into face "segments"
    by merging adjacent seconds if it wants.
    """
    path = await _download_to_tmp(req.source_url)
    try:
        detector = _get_face_detector()
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            raise HTTPException(status_code=502, detail="Failed to open video")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        duration_s = total_frames / fps if fps > 0 else 0

        detections: list[FaceDto] = []
        # Sample at most 1 frame per second, cap at 300 samples for 5-min videos
        sample_step_s = 1.0 if duration_s <= 300 else duration_s / 300
        t = 0.0
        while t < duration_s:
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, frame = cap.read()
            if not ok:
                break

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = detector.process(rgb)
            if result.detections:
                primary = max(
                    result.detections,
                    key=lambda d: d.location_data.relative_bounding_box.width
                    * d.location_data.relative_bounding_box.height,
                )
                bb = primary.location_data.relative_bounding_box
                detections.append(
                    FaceDto(
                        start_ms=int(t * 1000),
                        end_ms=int((t + sample_step_s) * 1000),
                        face_count=len(result.detections),
                        bbox_x=float(np.clip(bb.xmin, 0, 1)),
                        bbox_y=float(np.clip(bb.ymin, 0, 1)),
                        bbox_w=float(np.clip(bb.width, 0, 1)),
                        bbox_h=float(np.clip(bb.height, 0, 1)),
                    )
                )
            t += sample_step_s

        cap.release()
        logger.info("faces: %d detections for %s", len(detections), req.source_url[:80])
        return FacesResponse(detections=detections)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass
