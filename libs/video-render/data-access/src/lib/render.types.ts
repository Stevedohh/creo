export type RenderJobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface RenderJobDto {
  id: string;
  projectId: string | null;
  status: RenderJobStatus;
  progress: number;
  resultBytes: number | null;
  downloadUrl: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RenderCodec = 'h264' | 'h265' | 'vp9' | 'prores';
export type RenderPixelFormat = 'yuv420p' | 'yuv422p' | 'yuv444p';

export interface RenderExportSettings {
  codec: RenderCodec;
  crf: number;
  pixelFormat: RenderPixelFormat;
  width: number;
  height: number;
  fps: number;
  audioCodec: 'aac' | 'opus' | 'mp3';
  audioBitrate: string;
}

export interface StartDocumentRenderRequest {
  document: Record<string, unknown>;
  exportSettings?: Partial<RenderExportSettings>;
  name?: string;
}

export interface QualityPreset {
  id: string;
  label: string;
  description: string;
  settings: Partial<RenderExportSettings>;
}

export const QUALITY_PRESETS: QualityPreset[] = [
  {
    id: 'draft',
    label: 'Draft (720p)',
    description: 'Fast preview · H.264 · CRF 23',
    settings: { codec: 'h264', crf: 23, width: 1280, height: 720, fps: 30 },
  },
  {
    id: 'standard',
    label: 'Standard (1080p)',
    description: 'YouTube-ready · H.264 · CRF 18',
    settings: { codec: 'h264', crf: 18, width: 1920, height: 1080, fps: 30 },
  },
  {
    id: 'high',
    label: 'High (1440p)',
    description: 'Crisp · H.264 · CRF 16 · 60 fps',
    settings: { codec: 'h264', crf: 16, width: 2560, height: 1440, fps: 60 },
  },
  {
    id: 'ultra',
    label: 'Ultra (4K)',
    description: 'Archival · H.265 · CRF 14',
    settings: { codec: 'h265', crf: 14, width: 3840, height: 2160, fps: 30 },
  },
];
