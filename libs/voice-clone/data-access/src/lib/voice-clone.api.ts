import { apiClient } from '@creo/shared';
import type { CloneVoiceRequest, CloneVoiceResponse, Voice } from './voice-clone.types';

export function cloneVoice(data: CloneVoiceRequest): Promise<CloneVoiceResponse> {
  return apiClient.post<CloneVoiceResponse>('/voices/clone', data).then((res) => res.data);
}

export function getVoices(): Promise<Voice[]> {
  return apiClient.get<Voice[]>('/voices').then((res) => res.data);
}

export function deleteVoice(id: string): Promise<void> {
  return apiClient.delete(`/voices/${id}`).then((res) => res.data);
}
