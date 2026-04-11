import { z } from 'zod';

/**
 * V1 wrapper around Twick's ProjectJSON. We keep `tracks` opaque (`unknown`)
 * for now and only enforce the wrapper shape — Twick owns the inner format.
 * As we add custom clip metadata (assetId, AI-director provenance), tighten
 * this schema and add migrations rather than reshaping at the call site.
 */
export const ProjectTimelineV1 = z
  .object({
    version: z.number().default(1),
    tracks: z.array(z.unknown()).default([]),
  })
  .passthrough();

export type ProjectTimeline = z.infer<typeof ProjectTimelineV1>;

export function parseProjectTimeline(input: unknown): ProjectTimeline {
  return ProjectTimelineV1.parse(input);
}

export function emptyProjectTimeline(): ProjectTimeline {
  return { version: 1, tracks: [] };
}

/**
 * Identity passthrough for now. When schema diverges from Twick's ProjectJSON
 * (e.g. when we attach our own assetId references), this is where the mapping
 * lives so the rest of the codebase never touches Twick types directly.
 */
export function toTwickProjectJson<T>(timeline: ProjectTimeline): T {
  return timeline as unknown as T;
}

/**
 * Convert a Twick ProjectJSON (or anything shaped roughly like one) to our
 * canonical ProjectTimeline. Never throws: on mismatch we coerce to an empty
 * timeline so an in-flight Twick state can't crash the editor. The backend
 * re-validates strictly via {@link parseProjectTimeline} on PATCH.
 */
export function fromTwickProjectJson(input: unknown): ProjectTimeline {
  const result = ProjectTimelineV1.safeParse(input);
  if (result.success) return result.data;
  return emptyProjectTimeline();
}
