import { apiClient } from '@creo/shared';
import type {
  BreadcrumbItem,
  MediaAsset,
  MediaFolder,
  MediaTag,
  UploadInitResponse,
} from './media.types';

/* ─── Assets ─── */

export function getMediaAssets(params?: {
  folderId?: string;
  search?: string;
}): Promise<MediaAsset[]> {
  return apiClient
    .get<MediaAsset[]>('/media', { params })
    .then((res) => res.data);
}

export function getMediaAsset(id: string): Promise<MediaAsset> {
  return apiClient.get<MediaAsset>(`/media/${id}`).then((res) => res.data);
}

export function initMediaUpload(body: {
  filename: string;
  contentType: string;
  size?: number;
  displayName?: string;
  folderId?: string;
  tagIds?: string[];
}): Promise<UploadInitResponse> {
  return apiClient
    .post<UploadInitResponse>('/media/upload-init', body)
    .then((res) => res.data);
}

export function completeMediaUpload(assetId: string): Promise<MediaAsset> {
  return apiClient
    .post<MediaAsset>(`/media/${assetId}/upload-complete`)
    .then((res) => res.data);
}

export function updateMediaAsset(
  id: string,
  data: { name?: string; tagIds?: string[] },
): Promise<MediaAsset> {
  return apiClient
    .patch<MediaAsset>(`/media/${id}`, data)
    .then((res) => res.data);
}

export function deleteMediaAsset(assetId: string): Promise<{ id: string }> {
  return apiClient
    .delete<{ id: string }>(`/media/${assetId}`)
    .then((res) => res.data);
}

/* ─── Folders ─── */

export function getMediaFolders(parentId?: string): Promise<MediaFolder[]> {
  return apiClient
    .get<MediaFolder[]>('/media/folders', {
      params: parentId ? { parentId } : undefined,
    })
    .then((res) => res.data);
}

export function createMediaFolder(data: {
  name: string;
  parentId?: string;
}): Promise<MediaFolder> {
  return apiClient
    .post<MediaFolder>('/media/folders', data)
    .then((res) => res.data);
}

export function renameMediaFolder(
  id: string,
  name: string,
): Promise<MediaFolder> {
  return apiClient
    .patch<MediaFolder>(`/media/folders/${id}`, { name })
    .then((res) => res.data);
}

export function deleteMediaFolder(id: string): Promise<{ id: string }> {
  return apiClient
    .delete<{ id: string }>(`/media/folders/${id}`)
    .then((res) => res.data);
}

export function getFolderBreadcrumbs(
  folderId: string,
): Promise<BreadcrumbItem[]> {
  return apiClient
    .get<BreadcrumbItem[]>(`/media/folders/${folderId}/breadcrumbs`)
    .then((res) => res.data);
}

/* ─── Tags ─── */

export function getMediaTags(): Promise<MediaTag[]> {
  return apiClient.get<MediaTag[]>('/media/tags').then((res) => res.data);
}

export function createMediaTag(name: string): Promise<MediaTag> {
  return apiClient
    .post<MediaTag>('/media/tags', { name })
    .then((res) => res.data);
}

export function deleteMediaTag(id: string): Promise<{ id: string }> {
  return apiClient
    .delete<{ id: string }>(`/media/tags/${id}`)
    .then((res) => res.data);
}

/* ─── Project Assets ─── */

export function listProjectAssets(projectId: string): Promise<MediaAsset[]> {
  return apiClient
    .get<MediaAsset[]>(`/projects/${projectId}/assets`)
    .then((res) => res.data);
}

export function attachProjectAsset(projectId: string, assetId: string) {
  return apiClient
    .post<{ projectId: string; assetId: string }>(
      `/projects/${projectId}/assets/${assetId}`,
    )
    .then((res) => res.data);
}

export function detachProjectAsset(projectId: string, assetId: string) {
  return apiClient
    .delete<{ projectId: string; assetId: string }>(
      `/projects/${projectId}/assets/${assetId}`,
    )
    .then((res) => res.data);
}

/* ─── Upload flow ─── */

export async function uploadMediaFile(
  file: File,
  options?: {
    onProgress?: (progressPct: number) => void;
    displayName?: string;
    folderId?: string;
    tagIds?: string[];
  },
): Promise<MediaAsset> {
  const init = await initMediaUpload({
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
    displayName: options?.displayName,
    folderId: options?.folderId,
    tagIds: options?.tagIds,
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', init.uploadUrl);
    xhr.setRequestHeader(
      'Content-Type',
      file.type || 'application/octet-stream',
    );
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options?.onProgress) {
        options.onProgress(Math.round((e.loaded / e.total) * 100));
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
