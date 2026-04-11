export type AnalysisStatus = 'none' | 'queued' | 'running' | 'done' | 'failed';

export interface AnalysisShot {
  id: string;
  index: number;
  startMs: number;
  endMs: number;
  thumbnailKey: string | null;
}

export interface AnalysisTranscriptSegment {
  id: string;
  index: number;
  startMs: number;
  endMs: number;
  text: string;
}

export interface AnalysisFace {
  id: string;
  startMs: number;
  endMs: number;
  faceCount: number;
  bbox: { x: number; y: number; w: number; h: number };
}

export interface AssetAnalysis {
  assetId: string;
  status: AnalysisStatus;
  error: string | null;
  shots: AnalysisShot[];
  transcript: AnalysisTranscriptSegment[];
  faces: AnalysisFace[];
}
