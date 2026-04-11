import { apiClient } from '@creo/shared';
import type { MediaAsset, UploadInitResponse } from './media.types';

export function getMediaAssets(): Promise<MediaAsset[]> {
  return apiClient.get<MediaAsset[]>('/media').then((res) => res.data);
}

export function initMediaUpload(body: {
  filename: string;
  contentType: string;
  size?: number;
}): Promise<UploadInitResponse> {
  return apiClient.post<UploadInitResponse>('/media/upload-init', body).then((res) => res.data);
}

export function completeMediaUpload(assetId: string): Promise<MediaAsset> {
  return apiClient
    .post<MediaAsset>(`/media/${assetId}/upload-complete`)
    .then((res) => res.data);
}

export function deleteMediaAsset(assetId: string): Promise<{ id: string }> {
  return apiClient.delete<{ id: string }>(`/media/${assetId}`).then((res) => res.data);
}

export function listProjectAssets(projectId: string): Promise<MediaAsset[]> {
  return apiClient
    .get<MediaAsset[]>(`/projects/${projectId}/assets`)
    .then((res) => res.data);
}

export function attachProjectAsset(projectId: string, assetId: string) {
  return apiClient
    .post<{ projectId: string; assetId: string }>(`/projects/${projectId}/assets/${assetId}`)
    .then((res) => res.data);
}

export function detachProjectAsset(projectId: string, assetId: string) {
  return apiClient
    .delete<{ projectId: string; assetId: string }>(`/projects/${projectId}/assets/${assetId}`)
    .then((res) => res.data);
}

/**
 * Full three-step upload flow:
 *   1. Call our backend to reserve an asset row and get a presigned PUT URL.
 *   2. PUT the file directly from the browser to MinIO via that URL.
 *   3. Tell our backend the upload finished so it can ffprobe the object
 *      and flip the row from 'uploading' to 'ready'.
 *
 * `onProgress` is forwarded from step 2 so the UI can show an upload bar.
 * Any failure in any step surfaces as a rejected promise — the caller is
 * responsible for showing a toast / cleaning up.
 */
export async function uploadMediaFile(
  file: File,
  onProgress?: (progressPct: number) => void,
): Promise<MediaAsset> {
  const init = await initMediaUpload({
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', init.uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed with ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });

  return completeMediaUpload(init.assetId);
}
