import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVoiceovers, createVoiceover, deleteVoiceover } from './voiceover.api';
import type { Voiceover, CreateVoiceoverRequest } from './voiceover.types';

const VOICEOVERS_QUERY_KEY = ['voiceovers'] as const;

export const useVoiceovers = (scriptId: string) => {
  return useQuery({
    queryKey: [...VOICEOVERS_QUERY_KEY, scriptId],
    queryFn: () => getVoiceovers(scriptId),
    enabled: !!scriptId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasProcessing = data?.some(
        (v: Voiceover) =>
          v.status === 'processing' ||
          v.status === 'pending' ||
          v.status === 'uploading',
      );
      return hasProcessing ? 3000 : false;
    },
  });
};

export const useCreateVoiceover = (scriptId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVoiceoverRequest) => createVoiceover(scriptId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...VOICEOVERS_QUERY_KEY, scriptId] });
    },
  });
};

export const useDeleteVoiceover = (scriptId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVoiceover(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...VOICEOVERS_QUERY_KEY, scriptId] });
    },
  });
};
