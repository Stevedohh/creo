import type { EditorDocument, Track } from './types';
import { createEmptyDocument } from './types';

/**
 * Convert a `Project.timeline` JSON blob (as loaded from the API) into
 * a fully-formed EditorDocument. Handles three cases:
 *
 *   1. **Full EditorDocument** — timeline already has `id`, `resolution`,
 *      `tracks` etc. (projects saved by our editor). Pass through.
 *   2. **Legacy V1 wrapper** — `{ version: 1, tracks: [...] }` without
 *      top-level EditorDocument fields. Create an EditorDocument and
 *      adopt the tracks array.
 *   3. **Empty / null / garbage** — fall back to a fresh empty document.
 */
export function timelineToEditorDocument(
  timeline: unknown,
  projectTitle?: string,
): EditorDocument {
  if (!timeline || typeof timeline !== 'object') {
    return createEmptyDocument(projectTitle ?? 'Untitled');
  }

  const t = timeline as Record<string, unknown>;

  // Case 1: full EditorDocument shape (has resolution + tracks array)
  if (
    t.resolution &&
    typeof t.resolution === 'object' &&
    Array.isArray(t.tracks) &&
    t.fps &&
    typeof t.fps === 'number'
  ) {
    return {
      id: (t.id as string) ?? createEmptyDocument().id,
      name: (t.name as string) ?? projectTitle ?? 'Untitled',
      resolution: t.resolution as EditorDocument['resolution'],
      fps: t.fps as number,
      background: (t.background as string) ?? '#000000',
      tracks: t.tracks as Track[],
    };
  }

  // Case 2: legacy { version, tracks } — wrap in EditorDocument
  if (Array.isArray(t.tracks) && t.tracks.length > 0) {
    const doc = createEmptyDocument(projectTitle ?? 'Untitled');
    doc.tracks = t.tracks as Track[];
    return doc;
  }

  // Case 3: empty or incompatible
  return createEmptyDocument(projectTitle ?? 'Untitled');
}

/**
 * Serialize an EditorDocument into the shape stored in
 * `Project.timeline`. Currently identity — we store the full
 * EditorDocument as-is, stamped with `version: 1`.
 */
export function editorDocumentToTimeline(
  doc: EditorDocument,
): Record<string, unknown> {
  return {
    version: 1,
    ...doc,
  };
}
