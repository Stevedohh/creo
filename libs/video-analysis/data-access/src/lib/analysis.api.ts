import { apiClient } from '@creo/shared';
import type { AssetAnalysis } from './analysis.types';

export function getAssetAnalysis(assetId: string): Promise<AssetAnalysis> {
  return apiClient
    .get<AssetAnalysis>(`/analyze/${assetId}`)
    .then((res) => res.data);
}

export function enqueueAnalysis(assetId: string): Promise<{ id: string; analysisStatus: string }> {
  return apiClient
    .post<{ id: string; analysisStatus: string }>(`/analyze/${assetId}`)
    .then((res) => res.data);
}
