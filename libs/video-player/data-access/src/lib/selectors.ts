import type { Clip, EditorDocument, Track } from './types';

export const computeDuration = (doc: EditorDocument): number => {
  let max = 0;
  for (const track of doc.tracks) {
    for (const clip of track.clips) {
      if (clip.positionEnd > max) max = clip.positionEnd;
    }
  }
  return max;
};

export const getTrackById = (doc: EditorDocument, trackId: string): Track | undefined =>
  doc.tracks.find((t) => t.id === trackId);

export const getClipById = (
  doc: EditorDocument,
  clipId: string,
): { clip: Clip; track: Track } | undefined => {
  for (const track of doc.tracks) {
    const clip = track.clips.find((c) => c.id === clipId);
    if (clip) return { clip, track };
  }
  return undefined;
};

export const clampClipToTrack = (clip: Clip): Clip => {
  const positionStart = Math.max(0, clip.positionStart);
  const positionEnd = Math.max(positionStart + 0.1, clip.positionEnd);
  return { ...clip, positionStart, positionEnd };
};

export const splitClipAt = <T extends Clip>(clip: T, positionSeconds: number): [T, T] | null => {
  if (positionSeconds <= clip.positionStart || positionSeconds >= clip.positionEnd) {
    return null;
  }
  const positionDuration = clip.positionEnd - clip.positionStart;
  const sourceDuration = clip.sourceEnd - clip.sourceStart;
  const ratio = (positionSeconds - clip.positionStart) / positionDuration;
  const splitSource = clip.sourceStart + ratio * sourceDuration;
  const first: T = {
    ...clip,
    id: `${clip.id}_a`,
    positionEnd: positionSeconds,
    sourceEnd: splitSource,
  };
  const second: T = {
    ...clip,
    id: `${clip.id}_b`,
    positionStart: positionSeconds,
    sourceStart: splitSource,
  };
  return [first, second];
};
