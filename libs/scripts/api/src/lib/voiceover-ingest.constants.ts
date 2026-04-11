export const VOICEOVER_INGEST_QUEUE = 'voiceover-ingest';

export interface VoiceoverIngestJobData {
  voiceoverId: string;
  minimaxFileId: string;
}
