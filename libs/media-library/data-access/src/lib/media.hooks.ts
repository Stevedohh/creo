import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  attachProjectAsset,
  createAssetFromRender,
  createMediaFolder,
  createMediaTag,
  deleteMediaAsset,
  deleteMediaTag,
  deleteMediaFolder,
  detachProjectAsset,
  getMediaAssets,
  getMediaFolders,
  getMediaTags,
  getFolderBreadcrumbs,
  listProjectAssets,
  renameMediaFolder,
  updateMediaAsset,
  uploadMediaFile,
} from './media.api';

const MEDIA_KEY = ['media'] as const;
const FOLDERS_KEY = ['media-folders'] as const;
const TAGS_KEY = ['media-tags'] as const;

const mediaKey = (folderId?: string, search?: string) =>
  [...MEDIA_KEY, folderId ?? 'root', search ?? ''] as const;

const foldersKey = (parentId?: string) =>
  [...FOLDERS_KEY, parentId ?? 'root'] as const;

const breadcrumbsKey = (folderId?: string) =>
  ['media-breadcrumbs', folderId ?? ''] as const;

const projectAssetsKey = (projectId: string) =>
  ['projects', projectId, 'assets'] as const;

/* ─── Assets ─── */

export const useMediaAssets = (folderId?: string, search?: string) =>
  useQuery({
    queryKey: mediaKey(folderId, search),
    queryFn: () => getMediaAssets({ folderId, search }),
  });

export const useUploadMediaAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
      displayName,
      folderId,
      tagIds,
    }: {
      file: File;
      onProgress?: (pct: number) => void;
      displayName?: string;
      folderId?: string;
      tagIds?: string[];
    }) => uploadMediaFile(file, { onProgress, displayName, folderId, tagIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
    },
  });
};

export const useCreateAssetFromRender = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      renderJobId: string;
      folderId?: string;
      displayName?: string;
      tagIds?: string[];
    }) => createAssetFromRender(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
    },
  });
};

export const useUpdateMediaAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; tagIds?: string[] };
    }) => updateMediaAsset(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
    },
  });
};

export const useDeleteMediaAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMediaAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
    },
  });
};

/* ─── Folders ─── */

export const useMediaFolders = (parentId?: string) =>
  useQuery({
    queryKey: foldersKey(parentId),
    queryFn: () => getMediaFolders(parentId),
  });

export const useFolderBreadcrumbs = (folderId?: string) =>
  useQuery({
    queryKey: breadcrumbsKey(folderId),
    queryFn: () => getFolderBreadcrumbs(folderId!),
    enabled: !!folderId,
  });

export const useCreateMediaFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMediaFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
    },
  });
};

export const useRenameMediaFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameMediaFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
    },
  });
};

export const useDeleteMediaFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMediaFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_KEY });
    },
  });
};

/* ─── Tags ─── */

export const useMediaTags = () =>
  useQuery({ queryKey: TAGS_KEY, queryFn: getMediaTags });

export const useCreateMediaTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMediaTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
    },
  });
};

export const useDeleteMediaTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMediaTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TAGS_KEY });
      queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
    },
  });
};

/* ─── Project Assets ─── */

export const useProjectAssets = (projectId: string) =>
  useQuery({
    queryKey: projectAssetsKey(projectId),
    queryFn: () => listProjectAssets(projectId),
    enabled: !!projectId,
  });

export const useAttachProjectAsset = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => attachProjectAsset(projectId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectAssetsKey(projectId),
      });
    },
  });
};

export const useDetachProjectAsset = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => detachProjectAsset(projectId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectAssetsKey(projectId),
      });
    },
  });
};
