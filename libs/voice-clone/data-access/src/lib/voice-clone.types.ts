export interface CloneVoiceRequest {
  youtubeUrl: string;
  voiceName: string;
  startTime: string;
  endTime: string;
}

export interface CloneVoiceResponse {
  id: string;
  voiceId: string;
  voiceName: string;
  status: string;
  createdAt: string;
}

export interface Voice {
  id: string;
  minimaxVoiceId: string;
  name: string;
  sourceUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
