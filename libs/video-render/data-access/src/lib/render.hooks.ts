import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelRenderJob,
  getRenderJob,
  startDocumentRender,
  startProjectRender,
} from './render.api';
import type { RenderJobDto } from './render.types';

const RENDER_QUERY_KEY = ['render', 'jobs'] as const;

export const useStartProjectRender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startProjectRender,
    onSuccess: (job) => {
      qc.setQueryData([...RENDER_QUERY_KEY, job.id], job);
    },
  });
};

export const useStartDocumentRender = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startDocumentRender,
    onSuccess: (job) => {
      qc.setQueryData([...RENDER_QUERY_KEY, job.id], job);
    },
  });
};

const isTerminal = (status: RenderJobDto['status']): boolean =>
  status === 'succeeded' || status === 'failed' || status === 'canceled';

export const useRenderJob = (id: string | null) =>
  useQuery({
    queryKey: [...RENDER_QUERY_KEY, id],
    queryFn: () => (id ? getRenderJob(id) : Promise.reject(new Error('No job id'))),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as RenderJobDto | undefined;
      if (!data) return 1000;
      return isTerminal(data.status) ? false : 1000;
    },
  });

export const useCancelRenderJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelRenderJob,
    onSuccess: (job) => {
      qc.setQueryData([...RENDER_QUERY_KEY, job.id], job);
    },
  });
};
