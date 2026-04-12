import { create } from 'zustand';
import { produce } from 'immer';
import type { Clip, EditorDocument, EditorState, Resolution, Track, TrackId, TrackKind } from './types';
import { createEmptyDocument } from './types';
import { clampClipToTrack, computeDuration, splitClipAt } from './selectors';

const HISTORY_LIMIT = 100;

export interface ResizeClipPatch {
  positionStart?: number;
  positionEnd?: number;
  sourceStart?: number;
  sourceEnd?: number;
}

export interface TrackPatch {
  muted?: boolean;
  hidden?: boolean;
  locked?: boolean;
  name?: string;
}

interface EditorActions {
  replaceDocument: (doc: EditorDocument) => void;
  addClip: (trackId: TrackId, clip: Clip) => void;
  updateClip: (clipId: string, updater: (clip: Clip) => void) => void;
  removeClip: (clipId: string) => void;
  moveClip: (clipId: string, deltaSeconds: number) => void;
  resizeClip: (clipId: string, patch: ResizeClipPatch) => void;
  splitClipAtPlayhead: () => void;
  addTrack: (kind: TrackKind, name?: string) => TrackId;
  removeTrack: (trackId: TrackId) => void;
  updateTrack: (trackId: TrackId, patch: TrackPatch) => void;
  reorderTracks: (trackIds: TrackId[]) => void;
  moveClipToTrack: (clipId: string, targetTrackId: TrackId) => void;
  setResolution: (resolution: Resolution) => void;
  setProjectId: (id: string | null) => void;
  setSaving: (saving: boolean) => void;
  setLastSavedAt: (date: Date | null) => void;
  setPlayhead: (seconds: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoom: (zoom: number) => void;
  setSelection: (clipIds: string[]) => void;
  undo: () => void;
  redo: () => void;
}

type EditorStore = EditorState & EditorActions & {
  getDuration: () => number;
};

const initialDoc = createEmptyDocument('Untitled');

const pushHistory = (state: EditorState): EditorState => {
  const past = [...state.past, state.doc];
  if (past.length > HISTORY_LIMIT) past.shift();
  return { ...state, past, future: [] };
};

const mutateDoc = (
  state: EditorStore,
  recipe: (draft: EditorDocument) => void,
): Partial<EditorStore> => {
  const nextDoc = produce(state.doc, recipe);
  if (nextDoc === state.doc) return {};
  const historied = pushHistory(state);
  return { doc: nextDoc, past: historied.past, future: historied.future };
};

export const useEditorStore = create<EditorStore>((set, get) => ({
  doc: initialDoc,
  projectId: null,
  isSaving: false,
  lastSavedAt: null,
  playhead: 0,
  isPlaying: false,
  zoom: 100,
  selection: { clipIds: [] },
  past: [],
  future: [],

  getDuration: () => computeDuration(get().doc),

  replaceDocument: (doc) =>
    set((state) => ({
      doc,
      past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
      future: [],
      playhead: 0,
      selection: { clipIds: [] },
    })),

  addClip: (trackId, clip) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        const track = draft.tracks.find((t: Track) => t.id === trackId);
        if (!track) return;
        const clamped = clampClipToTrack(clip);
        track.clips.push(clamped);
        track.clips.sort((a, b) => a.positionStart - b.positionStart);
      }),
    ),

  updateClip: (clipId, updater) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        for (const track of draft.tracks) {
          const clip = track.clips.find((c: Clip) => c.id === clipId);
          if (clip) {
            updater(clip);
            return;
          }
        }
      }),
    ),

  removeClip: (clipId) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        for (const track of draft.tracks) {
          const idx = track.clips.findIndex((c: Clip) => c.id === clipId);
          if (idx >= 0) {
            track.clips.splice(idx, 1);
            return;
          }
        }
      }),
    ),

  moveClip: (clipId, deltaSeconds) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        for (const track of draft.tracks) {
          const clip = track.clips.find((c: Clip) => c.id === clipId);
          if (!clip) continue;
          const duration = clip.positionEnd - clip.positionStart;
          const nextStart = Math.max(0, clip.positionStart + deltaSeconds);
          clip.positionStart = nextStart;
          clip.positionEnd = nextStart + duration;
          return;
        }
      }),
    ),

  resizeClip: (clipId, patch) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        const MIN_DURATION = 0.05;
        for (const track of draft.tracks) {
          const clip = track.clips.find((c: Clip) => c.id === clipId);
          if (!clip) continue;
          if (patch.positionStart !== undefined) {
            clip.positionStart = Math.max(
              0,
              Math.min(patch.positionStart, clip.positionEnd - MIN_DURATION),
            );
          }
          if (patch.positionEnd !== undefined) {
            clip.positionEnd = Math.max(
              clip.positionStart + MIN_DURATION,
              patch.positionEnd,
            );
          }
          if (patch.sourceStart !== undefined) {
            clip.sourceStart = Math.max(
              0,
              Math.min(patch.sourceStart, clip.sourceEnd - MIN_DURATION),
            );
          }
          if (patch.sourceEnd !== undefined) {
            clip.sourceEnd = Math.max(
              clip.sourceStart + MIN_DURATION,
              patch.sourceEnd,
            );
          }
          return;
        }
      }),
    ),

  splitClipAtPlayhead: () => {
    const { selection, playhead } = get();
    const targetId = selection.clipIds[0];
    if (!targetId) return;
    set((state) =>
      mutateDoc(state, (draft) => {
        for (const track of draft.tracks) {
          const idx = track.clips.findIndex((c: Clip) => c.id === targetId);
          if (idx < 0) continue;
          const clip = track.clips[idx];
          const split = splitClipAt(clip, playhead);
          if (!split) return;
          track.clips.splice(idx, 1, split[0], split[1]);
          return;
        }
      }),
    );
  },

  addTrack: (kind, name) => {
    const id = `track_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    set((state) =>
      mutateDoc(state, (draft) => {
        draft.tracks.push({
          id,
          kind,
          name: name ?? `${kind} ${draft.tracks.length + 1}`,
          muted: false,
          locked: false,
          hidden: false,
          clips: [],
        });
      }),
    );
    return id;
  },

  removeTrack: (trackId) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        draft.tracks = draft.tracks.filter((t: Track) => t.id !== trackId);
      }),
    ),

  updateTrack: (trackId, patch) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        const track = draft.tracks.find((t: Track) => t.id === trackId);
        if (!track) return;
        if (patch.muted !== undefined) track.muted = patch.muted;
        if (patch.hidden !== undefined) track.hidden = patch.hidden;
        if (patch.locked !== undefined) track.locked = patch.locked;
        if (patch.name !== undefined) track.name = patch.name;
      }),
    ),

  reorderTracks: (trackIds) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        const byId = new Map(draft.tracks.map((t: Track) => [t.id, t]));
        const reordered: Track[] = [];
        for (const id of trackIds) {
          const track = byId.get(id);
          if (track) reordered.push(track);
        }
        // Keep any tracks not mentioned (safety).
        for (const track of draft.tracks) {
          if (!trackIds.includes(track.id)) reordered.push(track);
        }
        draft.tracks = reordered;
      }),
    ),

  moveClipToTrack: (clipId, targetTrackId) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        for (const track of draft.tracks) {
          const idx = track.clips.findIndex((c: Clip) => c.id === clipId);
          if (idx < 0) continue;
          if (track.id === targetTrackId) return; // already on target
          const [clip] = track.clips.splice(idx, 1);
          clip.trackId = targetTrackId;
          const target = draft.tracks.find((t: Track) => t.id === targetTrackId);
          if (target) {
            target.clips.push(clip);
            target.clips.sort((a, b) => a.positionStart - b.positionStart);
          }
          return;
        }
      }),
    ),

  setResolution: (resolution) =>
    set((state) =>
      mutateDoc(state, (draft) => {
        draft.resolution = resolution;
      }),
    ),

  setProjectId: (id) => set({ projectId: id }),
  setSaving: (saving) => set({ isSaving: saving }),
  setLastSavedAt: (date) => set({ lastSavedAt: date }),
  setPlayhead: (seconds) => set({ playhead: Math.max(0, seconds) }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),
  setSelection: (clipIds) => set({ selection: { clipIds } }),

  undo: () =>
    set((state) => {
      if (state.past.length === 0) return {};
      const prev = state.past[state.past.length - 1];
      return {
        doc: prev,
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future].slice(0, HISTORY_LIMIT),
      };
    }),

  redo: () =>
    set((state) => {
      if (state.future.length === 0) return {};
      const next = state.future[0];
      return {
        doc: next,
        past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
      };
    }),
}));
