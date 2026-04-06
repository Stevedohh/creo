import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cloneVoice, getVoices, deleteVoice } from './voice-clone.api';

const VOICES_QUERY_KEY = ['voices'] as const;

export const useVoices = () => {
  return useQuery({
    queryKey: VOICES_QUERY_KEY,
    queryFn: getVoices,
  });
};

export const useCloneVoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cloneVoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOICES_QUERY_KEY });
    },
  });
};

export const useDeleteVoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VOICES_QUERY_KEY });
    },
  });
};
