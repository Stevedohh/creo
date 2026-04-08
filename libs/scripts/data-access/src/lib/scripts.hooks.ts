import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getScripts, getScript, createScript, updateScript, deleteScript } from './scripts.api';
import type { UpdateScriptRequest } from './scripts.types';

const SCRIPTS_QUERY_KEY = ['scripts'] as const;

export const useScripts = () => {
  return useQuery({
    queryKey: SCRIPTS_QUERY_KEY,
    queryFn: getScripts,
  });
};

export const useScript = (id: string) => {
  return useQuery({
    queryKey: [...SCRIPTS_QUERY_KEY, id],
    queryFn: () => getScript(id),
    enabled: !!id,
  });
};

export const useCreateScript = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createScript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCRIPTS_QUERY_KEY });
    },
  });
};

export const useUpdateScript = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScriptRequest }) =>
      updateScript(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: SCRIPTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...SCRIPTS_QUERY_KEY, variables.id] });
    },
  });
};

export const useDeleteScript = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteScript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SCRIPTS_QUERY_KEY });
    },
  });
};
