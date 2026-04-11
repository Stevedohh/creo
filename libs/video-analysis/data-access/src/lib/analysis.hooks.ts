import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enqueueAnalysis, getAssetAnalysis } from './analysis.api';
import type { AssetAnalysis } from './analysis.types';

const analysisKey = (assetId: string) => ['analyze', assetId] as const;

export const useAssetAnalysis = (assetId: string | null) =>
  useQuery({
    queryKey: analysisKey(assetId ?? ''),
    queryFn: () => getAssetAnalysis(assetId!),
    enabled: !!assetId,
    // Poll every 3s while running/queued, idle otherwise.
    refetchInterval: (query) => {
      const data = query.state.data as AssetAnalysis | undefined;
      if (!data) return 3000;
      return data.status === 'queued' || data.status === 'running' ? 3000 : false;
    },
  });

export const useEnqueueAnalysis = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: enqueueAnalysis,
    onSuccess: (_data, assetId) => {
      queryClient.invalidateQueries({ queryKey: analysisKey(assetId) });
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
  });
};
