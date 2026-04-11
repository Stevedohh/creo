import { apiClient } from '@creo/shared';
import type { Voiceover, CreateVoiceoverRequest } from './voiceover.types';

export function getVoiceovers(scriptId: string): Promise<Voiceover[]> {
  return apiClient.get<Voiceover[]>(`/scripts/${scriptId}/voiceovers`).then((res) => res.data);
}

export function createVoiceover(scriptId: string, data: CreateVoiceoverRequest): Promise<Voiceover> {
  return apiClient.post<Voiceover>(`/scripts/${scriptId}/voiceovers`, data).then((res) => res.data);
}

export function getVoiceoverAudioUrl(id: string): Promise<{ url: string }> {
  return apiClient.get<{ url: string }>(`/voiceovers/${id}/audio`).then((res) => res.data);
}

export function deleteVoiceover(id: string): Promise<void> {
  return apiClient.delete(`/voiceovers/${id}`).then((res) => res.data);
}
