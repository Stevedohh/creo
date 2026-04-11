import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  attachProjectAsset,
  deleteMediaAsset,
  detachProjectAsset,
  getMediaAssets,
  listProjectAssets,
  uploadMediaFile,
} from './media.api';

const MEDIA_KEY = ['media'] as const;
const projectAssetsKey = (projectId: string) =>
  ['projects', projectId, 'assets'] as const;

export const useMediaAssets = () =>
  useQuery({ queryKey: MEDIA_KEY, queryFn: getMediaAssets });

export const useProjectAssets = (projectId: string) =>
  useQuery({
    queryKey: projectAssetsKey(projectId),
    queryFn: () => listProjectAssets(projectId),
    enabled: !!projectId,
  });

export const useUploadMediaAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress?: (pct: number) => void;
    }) => uploadMediaFile(file, onProgress),
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

export const useAttachProjectAsset = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => attachProjectAsset(projectId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectAssetsKey(projectId) });
    },
  });
};

export const useDetachProjectAsset = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => detachProjectAsset(projectId, assetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectAssetsKey(projectId) });
    },
  });
};
