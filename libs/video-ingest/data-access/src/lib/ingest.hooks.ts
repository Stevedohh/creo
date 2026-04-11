import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getIngestJob, ingestYoutube, listIngestJobs } from './ingest.api';
import type { IngestJob } from './ingest.types';

const INGEST_JOBS_KEY = ['ingest', 'jobs'] as const;
const ingestJobKey = (id: string) => ['ingest', 'job', id] as const;

export const useIngestJobs = () =>
  useQuery({
    queryKey: INGEST_JOBS_KEY,
    queryFn: listIngestJobs,
    // Refetch every 2s while the list contains an active job; idle otherwise.
    refetchInterval: (query) => {
      const data = (query.state.data ?? []) as IngestJob[];
      return data.some((j) => j.status === 'queued' || j.status === 'running') ? 2000 : false;
    },
  });

export const useIngestJob = (id: string | null) =>
  useQuery({
    queryKey: ingestJobKey(id ?? ''),
    queryFn: () => getIngestJob(id!),
    enabled: !!id,
    // Poll every 1.5s until the job reaches a terminal state.
    refetchInterval: (query) => {
      const data = query.state.data as IngestJob | undefined;
      if (!data) return 1500;
      return data.status === 'queued' || data.status === 'running' ? 1500 : false;
    },
  });

export const useIngestYoutube = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => ingestYoutube(url),
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: INGEST_JOBS_KEY });
      queryClient.setQueryData(ingestJobKey(job.id), job);
    },
  });
};
