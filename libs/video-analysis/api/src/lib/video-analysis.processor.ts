import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '@creo/prisma';
import { StorageService } from '@creo/storage-api';
import { AiWorkerClient } from './ai-worker.client';
import {
  VIDEO_ANALYSIS_QUEUE,
  type VideoAnalysisJobData,
} from './video-analysis.constants';

/**
 * Orchestrates three independent calls into the apps/ai-worker FastAPI
 * sidecar. Each step is resilient: if transcribe fails, we still keep the
 * shots and faces we already got. The asset is marked "done" if at least
 * one step succeeded, otherwise "failed". Error messages from failed steps
 * get aggregated on analysisError so the user can see what went wrong.
 *
 * Concurrency is 1 because whisper + mediapipe are CPU-heavy and the
 * ai-worker process is single-tenant.
 */
@Processor(VIDEO_ANALYSIS_QUEUE, { concurrency: 1 })
export class VideoAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoAnalysisProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly aiWorker: AiWorkerClient,
  ) {
    super();
  }

  async process(job: Job<VideoAnalysisJobData>): Promise<void> {
    const { assetId } = job.data;
    this.logger.log(`Analysis start asset=${assetId}`);

    const asset = await this.prisma.mediaAsset.findUnique({
      where: { id: assetId },
    });
    if (!asset) {
      this.logger.warn(`Asset ${assetId} disappeared; skipping`);
      return;
    }
    if (asset.kind !== 'video') {
      this.logger.log(`Asset ${assetId} is not video; skipping`);
      return;
    }

    await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: { analysisStatus: 'running', analysisError: null },
    });

    const sourceUrl = await this.storage.getInternalPresignedUrl(
      asset.storageKey,
      60 * 60,
    );

    // Wipe any stale rows from a previous partial run before re-populating.
    await this.prisma.$transaction([
      this.prisma.shot.deleteMany({ where: { assetId } }),
      this.prisma.transcriptSegment.deleteMany({ where: { assetId } }),
      this.prisma.faceDetection.deleteMany({ where: { assetId } }),
    ]);

    const errors: string[] = [];
    let anySuccess = false;

    // Step 1: shot detection + thumbnail upload
    try {
      const scenes = await this.aiWorker.scenes(sourceUrl);
      for (const shot of scenes.shots) {
        // Upload thumbnail (if the worker returned one) to MinIO so the UI
        // can render a presigned URL instead of inlining base64 everywhere.
        let thumbnailKey: string | null = null;
        if (shot.thumbnail_b64) {
          try {
            const key = `analysis/${asset.userId}/${assetId}/shot-${shot.index}.jpg`;
            const buffer = Buffer.from(shot.thumbnail_b64, 'base64');
            await this.storage.upload({
              key,
              body: buffer,
              contentType: 'image/jpeg',
              contentLength: buffer.byteLength,
            });
            thumbnailKey = key;
          } catch (err) {
            this.logger.warn(
              `thumbnail upload failed shot=${shot.index}: ${err instanceof Error ? err.message : err}`,
            );
          }
        }
        await this.prisma.shot.create({
          data: {
            assetId,
            index: shot.index,
            startMs: shot.start_ms,
            endMs: shot.end_ms,
            thumbnailKey,
          },
        });
      }
      anySuccess = true;
      this.logger.log(`asset=${assetId} scenes=${scenes.shots.length}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`scenes: ${msg}`);
      this.logger.warn(`asset=${assetId} scenes failed: ${msg}`);
    }

    // Step 2: transcription (stubs to empty if whisper disabled)
    try {
      const transcript = await this.aiWorker.transcribe(sourceUrl);
      if (transcript.segments.length > 0) {
        await this.prisma.transcriptSegment.createMany({
          data: transcript.segments.map((s) => ({
            assetId,
            index: s.index,
            startMs: s.start_ms,
            endMs: s.end_ms,
            text: s.text,
          })),
        });
      }
      anySuccess = true;
      this.logger.log(
        `asset=${assetId} transcript=${transcript.segments.length} lang=${transcript.language}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`transcript: ${msg}`);
      this.logger.warn(`asset=${assetId} transcript failed: ${msg}`);
    }

    // Step 3: face detection
    try {
      const faces = await this.aiWorker.faces(sourceUrl);
      if (faces.detections.length > 0) {
        await this.prisma.faceDetection.createMany({
          data: faces.detections.map((f) => ({
            assetId,
            startMs: f.start_ms,
            endMs: f.end_ms,
            faceCount: f.face_count,
            bboxX: f.bbox_x,
            bboxY: f.bbox_y,
            bboxW: f.bbox_w,
            bboxH: f.bbox_h,
          })),
        });
      }
      anySuccess = true;
      this.logger.log(`asset=${assetId} faces=${faces.detections.length}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`faces: ${msg}`);
      this.logger.warn(`asset=${assetId} faces failed: ${msg}`);
    }

    await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        analysisStatus: anySuccess ? 'done' : 'failed',
        analysisError: errors.length > 0 ? errors.join('; ').slice(0, 1000) : null,
      },
    });
    this.logger.log(
      `Analysis ${anySuccess ? 'done' : 'failed'} asset=${assetId} errors=${errors.length}`,
    );
    if (!anySuccess) throw new Error(errors.join('; '));
  }
}
