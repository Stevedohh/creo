export type ClipId = string;
export type TrackId = string;
export type AssetId = string;

export type ClipType = 'video' | 'audio' | 'image' | 'text';
export type TrackKind = 'video' | 'audio' | 'overlay';

export interface Resolution {
  width: number;
  height: number;
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

interface BaseClipFields {
  id: ClipId;
  trackId: TrackId;
  positionStart: number;
  positionEnd: number;
  sourceStart: number;
  sourceEnd: number;
  speed: number;
  zIndex: number;
}

export interface BaseClip extends BaseClipFields {
  type: ClipType;
}

export interface VideoClip extends BaseClipFields {
  type: 'video';
  assetId: AssetId;
  src?: string;
  volume: number;
  muted: boolean;
  transform: Transform;
}

export interface ImageClip extends BaseClipFields {
  type: 'image';
  assetId: AssetId;
  src?: string;
  transform: Transform;
}

export interface AudioClip extends BaseClipFields {
  type: 'audio';
  assetId: AssetId;
  src?: string;
  volume: number;
  muted: boolean;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string | null;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
  strokeColor: string | null;
  strokeWidth: number;
}

export interface TextClip extends BaseClipFields {
  type: 'text';
  text: string;
  style: TextStyle;
  transform: Transform;
  fadeInSeconds: number;
  fadeOutSeconds: number;
}

export type Clip = VideoClip | AudioClip | ImageClip | TextClip;

export interface Track {
  id: TrackId;
  kind: TrackKind;
  name: string;
  muted: boolean;
  locked: boolean;
  hidden: boolean;
  clips: Clip[];
}

export interface Selection {
  clipIds: ClipId[];
}

export interface EditorDocument {
  id: string;
  name: string;
  resolution: Resolution;
  fps: number;
  tracks: Track[];
  background: string;
}

export interface EditorState {
  doc: EditorDocument;
  projectId: string | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
  playhead: number;
  isPlaying: boolean;
  zoom: number;
  selection: Selection;
  past: EditorDocument[];
  future: EditorDocument[];
}

export const DEFAULT_RESOLUTION: Resolution = { width: 1920, height: 1080 };
export const DEFAULT_FPS = 30;

let idCounter = 0;
const makeId = (prefix: string) => {
  idCounter += 1;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${idCounter}`;
};

export const createEmptyDocument = (name = 'Untitled'): EditorDocument => ({
  id: makeId('doc'),
  name,
  resolution: DEFAULT_RESOLUTION,
  fps: DEFAULT_FPS,
  background: '#000000',
  tracks: [
    {
      id: makeId('track'),
      kind: 'overlay',
      name: 'Overlay 1',
      muted: false,
      locked: false,
      hidden: false,
      clips: [],
    },
    {
      id: makeId('track'),
      kind: 'video',
      name: 'Video 1',
      muted: false,
      locked: false,
      hidden: false,
      clips: [],
    },
    {
      id: makeId('track'),
      kind: 'audio',
      name: 'Audio 1',
      muted: false,
      locked: false,
      hidden: false,
      clips: [],
    },
  ],
});
