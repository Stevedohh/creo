export interface Voiceover {
  id: string;
  scriptId: string;
  voiceId: string;
  voice: { id: string; name: string };
  audioUrl: string | null;
  status: 'pending' | 'processing' | 'uploading' | 'completed' | 'failed';
  characterCount: number;
  createdAt: string;
}

export interface CreateVoiceoverRequest {
  voiceId: string;
}
