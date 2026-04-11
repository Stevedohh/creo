import { apiClient } from '@creo/shared';
import type { IngestJob } from './ingest.types';

export function ingestYoutube(url: string): Promise<IngestJob> {
  return apiClient
    .post<IngestJob>('/ingest/youtube', { url })
    .then((res) => res.data);
}

export function getIngestJob(id: string): Promise<IngestJob> {
  return apiClient.get<IngestJob>(`/ingest/jobs/${id}`).then((res) => res.data);
}

export function listIngestJobs(): Promise<IngestJob[]> {
  return apiClient.get<IngestJob[]>('/ingest/jobs').then((res) => res.data);
}
