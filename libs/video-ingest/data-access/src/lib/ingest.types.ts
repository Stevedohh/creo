export type IngestJobStatus = 'queued' | 'running' | 'done' | 'failed';

export interface IngestJob {
  id: string;
  kind: 'youtube';
  sourceUrl: string;
  title: string | null;
  status: IngestJobStatus;
  progress: number;
  assetId: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
