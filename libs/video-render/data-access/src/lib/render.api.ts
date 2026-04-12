import { apiClient } from '@creo/shared';
import type { RenderJobDto, StartDocumentRenderRequest } from './render.types';

export function startProjectRender(projectId: string): Promise<RenderJobDto> {
  return apiClient
    .post<RenderJobDto>(`/render/projects/${projectId}`)
    .then((res) => res.data);
}

export function startDocumentRender(
  body: StartDocumentRenderRequest,
): Promise<RenderJobDto> {
  return apiClient
    .post<RenderJobDto>('/render/document', body)
    .then((res) => res.data);
}

export function getRenderJob(id: string): Promise<RenderJobDto> {
  return apiClient.get<RenderJobDto>(`/render/jobs/${id}`).then((res) => res.data);
}

export function cancelRenderJob(id: string): Promise<RenderJobDto> {
  return apiClient
    .post<RenderJobDto>(`/render/jobs/${id}/cancel`)
    .then((res) => res.data);
}
