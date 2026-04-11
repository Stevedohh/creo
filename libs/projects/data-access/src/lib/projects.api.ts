import { apiClient } from '@creo/shared';
import type { ProjectTimeline } from '@creo/projects-schema';
import type { Project, CreateProjectRequest, UpdateProjectRequest } from './projects.types';

export function getProjects(): Promise<Project[]> {
  return apiClient.get<Project[]>('/projects').then((res) => res.data);
}

export function getProject(id: string): Promise<Project> {
  return apiClient.get<Project>(`/projects/${id}`).then((res) => res.data);
}

export function createProject(data: CreateProjectRequest): Promise<Project> {
  return apiClient.post<Project>('/projects', data).then((res) => res.data);
}

export function updateProject(
  id: string,
  data: UpdateProjectRequest,
): Promise<Project> {
  return apiClient.patch<Project>(`/projects/${id}`, data).then((res) => res.data);
}

export function updateProjectTimeline(
  id: string,
  timeline: ProjectTimeline,
): Promise<Project> {
  return apiClient
    .patch<Project>(`/projects/${id}/timeline`, { timeline })
    .then((res) => res.data);
}

export function deleteProject(id: string): Promise<{ id: string }> {
  return apiClient.delete<{ id: string }>(`/projects/${id}`).then((res) => res.data);
}
