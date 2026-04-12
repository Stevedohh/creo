import { useEffect, useRef } from 'react';
import {
  useEditorStore,
  editorDocumentToTimeline,
} from '@creo/video-player-data-access';
import { useUpdateProjectTimeline } from '@creo/projects-data-access';

/**
 * Debounced auto-save: whenever the EditorDocument changes and a
 * projectId is set, schedules a PATCH /projects/:id/timeline after
 * `debounceMs` of idle. Skips if no projectId (scratchpad mode).
 *
 * Uses a snapshot ref to avoid re-saving when the doc hasn't actually
 * changed (e.g. when only playhead moved).
 */
export const useAutoSave = (debounceMs = 1000) => {
  const doc = useEditorStore((s) => s.doc);
  const projectId = useEditorStore((s) => s.projectId);
  const setSaving = useEditorStore((s) => s.setSaving);
  const setLastSavedAt = useEditorStore((s) => s.setLastSavedAt);

  const { mutate } = useUpdateProjectTimeline();
  const lastSavedJsonRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const json = JSON.stringify(doc);

    // First render after load — initialize the baseline.
    if (lastSavedJsonRef.current === null) {
      lastSavedJsonRef.current = json;
      return;
    }

    // Nothing changed since last save.
    if (json === lastSavedJsonRef.current) return;

    const timer = setTimeout(() => {
      setSaving(true);
      const timeline = editorDocumentToTimeline(doc);
      mutate(
        { id: projectId, timeline: timeline as never },
        {
          onSuccess: () => {
            lastSavedJsonRef.current = json;
            setSaving(false);
            setLastSavedAt(new Date());
          },
          onError: () => {
            setSaving(false);
          },
        },
      );
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [doc, projectId, debounceMs, mutate, setSaving, setLastSavedAt]);
};
