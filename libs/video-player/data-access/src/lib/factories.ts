import type { MediaAsset } from '@creo/media-library-data-access';
import type {
  AudioClip,
  Clip,
  EditorDocument,
  ImageClip,
  TextClip,
  TextStyle,
  TrackId,
  TrackKind,
  VideoClip,
} from './types';

const DEFAULT_IMAGE_DURATION = 3;

const makeId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

const fullFrameTransform = (doc: EditorDocument) => ({
  x: 0,
  y: 0,
  width: doc.resolution.width,
  height: doc.resolution.height,
  rotation: 0,
  opacity: 1,
});

const centeredTextTransform = (doc: EditorDocument) => {
  const w = doc.resolution.width;
  const h = doc.resolution.height;
  const boxW = Math.round(w * 0.8);
  const boxH = Math.round(h * 0.3);
  return {
    x: Math.round((w - boxW) / 2),
    y: Math.round((h - boxH) / 2),
    width: boxW,
    height: boxH,
    rotation: 0,
    opacity: 1,
  };
};

/**
 * Build a Clip for the editor timeline from a MediaAsset pulled out of
 * the media library. Source duration is taken from `asset.durationMs`
 * (already extracted by ffprobe at upload time). Images default to 3s.
 */
export const createClipFromAsset = (
  asset: MediaAsset,
  trackId: TrackId,
  positionStart: number,
  doc: EditorDocument,
): Clip | null => {
  const start = Math.max(0, positionStart);
  if (asset.kind === 'video') {
    const durationSec = (asset.durationMs ?? 0) / 1000 || 1;
    const clip: VideoClip = {
      id: makeId('clip'),
      trackId,
      type: 'video',
      positionStart: start,
      positionEnd: start + durationSec,
      sourceStart: 0,
      sourceEnd: durationSec,
      speed: 1,
      zIndex: 0,
      assetId: asset.id,
      src: asset.url ?? undefined,
      volume: 1,
      muted: false,
      transform: fullFrameTransform(doc),
    };
    return clip;
  }
  if (asset.kind === 'image') {
    const clip: ImageClip = {
      id: makeId('clip'),
      trackId,
      type: 'image',
      positionStart: start,
      positionEnd: start + DEFAULT_IMAGE_DURATION,
      sourceStart: 0,
      sourceEnd: DEFAULT_IMAGE_DURATION,
      speed: 1,
      zIndex: 0,
      assetId: asset.id,
      src: asset.url ?? undefined,
      transform: fullFrameTransform(doc),
    };
    return clip;
  }
  if (asset.kind === 'audio') {
    const durationSec = (asset.durationMs ?? 0) / 1000 || 1;
    const clip: AudioClip = {
      id: makeId('clip'),
      trackId,
      type: 'audio',
      positionStart: start,
      positionEnd: start + durationSec,
      sourceStart: 0,
      sourceEnd: durationSec,
      speed: 1,
      zIndex: 0,
      assetId: asset.id,
      src: asset.url ?? undefined,
      volume: 1,
      muted: false,
    };
    return clip;
  }
  return null;
};

/**
 * Which track kinds can host a given asset kind. Video assets prefer
 * a video track, fall back to overlay if none exists.
 */
export const compatibleTrackKinds = (assetKind: MediaAsset['kind']): TrackKind[] => {
  switch (assetKind) {
    case 'video':
      return ['video', 'overlay'];
    case 'image':
      return ['overlay', 'video'];
    case 'audio':
      return ['audio'];
  }
};

export const pickDefaultTrackForAsset = (
  doc: EditorDocument,
  assetKind: MediaAsset['kind'],
): TrackId | null => {
  const kinds = compatibleTrackKinds(assetKind);
  for (const kind of kinds) {
    const track = doc.tracks.find((t) => t.kind === kind);
    if (track) return track.id;
  }
  return null;
};

/**
 * Build a default text clip placed at the given position on an
 * overlay track. Used by the "Add text" toolbar button.
 */
export const createDefaultTextClip = (
  trackId: TrackId,
  positionStart: number,
  doc: EditorDocument,
): TextClip => {
  const style: TextStyle = {
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontSize: 110,
    fontWeight: 800,
    color: '#ffffff',
    backgroundColor: null,
    align: 'center',
    letterSpacing: -2,
    lineHeight: 1.1,
    strokeColor: null,
    strokeWidth: 0,
  };
  return {
    id: makeId('clip'),
    trackId,
    type: 'text',
    positionStart,
    positionEnd: positionStart + 3,
    sourceStart: 0,
    sourceEnd: 3,
    speed: 1,
    zIndex: 10,
    text: 'Hello from Creo',
    fadeInSeconds: 0.3,
    fadeOutSeconds: 0.3,
    transform: centeredTextTransform(doc),
    style,
  };
};
