export type RenderJobStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled';

export interface RenderJobDto {
  id: string;
  projectId: string | null;
  status: RenderJobStatus;
  progress: number;
  resultBytes: number | null;
  downloadUrl: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
