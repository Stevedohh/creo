export type MediaKind = 'video' | 'audio' | 'image';
export type MediaAssetStatus = 'uploading' | 'ready' | 'failed';
export type MediaSource = 'upload' | 'youtube';

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  source: MediaSource;
  sourceUrl: string | null;
  originalName: string | null;
  storageBytes: number | null;
  durationMs: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
  status: MediaAssetStatus;
  errorMessage: string | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadInitResponse {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}
