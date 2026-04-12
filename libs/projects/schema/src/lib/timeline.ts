import { z } from 'zod';

/**
 * V1 project timeline schema. Wraps an EditorDocument as a generic
 * JSON blob with a version field for future migrations. All top-level
 * EditorDocument fields are optional so old projects that only have
 * `{ version: 1, tracks: [] }` still parse cleanly.
 */
export const ProjectTimelineV1 = z
  .object({
    version: z.number().default(1),
    id: z.string().optional(),
    name: z.string().optional(),
    resolution: z
      .object({ width: z.number(), height: z.number() })
      .optional(),
    fps: z.number().optional(),
    background: z.string().optional(),
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
