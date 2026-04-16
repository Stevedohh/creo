export type MediaKind = 'video' | 'audio' | 'image';
export type MediaAssetStatus = 'uploading' | 'ready' | 'failed';
export type MediaSource = 'upload' | 'youtube' | 'render';

export interface MediaTag {
  id: string;
  name: string;
}

export interface MediaFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  folderId: string | null;
  tags: MediaTag[];
  url: string | null;
  analysisStatus?: 'none' | 'queued' | 'running' | 'done' | 'failed';
  analysisError?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadInitResponse {
  assetId: string;
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}
