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
  audioBitrate: `${number}k` | `${number}K` | `${number}M`;
}

export const DEFAULT_EXPORT_SETTINGS: RenderExportSettings = {
  codec: 'h264',
  crf: 18,
  pixelFormat: 'yuv420p',
  width: 1920,
  height: 1080,
  fps: 30,
  audioCodec: 'aac',
  audioBitrate: '192k',
};

export interface RenderSnapshotPayload {
  document: unknown;
  exportSettings: RenderExportSettings;
}
