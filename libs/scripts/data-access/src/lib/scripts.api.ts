import { apiClient } from '@creo/shared';
import type { Script, CreateScriptRequest, UpdateScriptRequest } from './scripts.types';

export function getScripts(): Promise<Script[]> {
  return apiClient.get<Script[]>('/scripts').then((res) => res.data);
}

export function getScript(id: string): Promise<Script> {
  return apiClient.get<Script>(`/scripts/${id}`).then((res) => res.data);
}

export function createScript(data: CreateScriptRequest): Promise<Script> {
  return apiClient.post<Script>('/scripts', data).then((res) => res.data);
}

export function updateScript(id: string, data: UpdateScriptRequest): Promise<Script> {
  return apiClient.patch<Script>(`/scripts/${id}`, data).then((res) => res.data);
}

export function deleteScript(id: string): Promise<{ id: string }> {
  return apiClient.delete<{ id: string }>(`/scripts/${id}`).then((res) => res.data);
}
