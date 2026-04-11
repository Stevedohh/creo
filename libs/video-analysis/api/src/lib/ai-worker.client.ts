import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';

export interface ShotDto {
  index: number;
  start_ms: number;
  end_ms: number;
  thumbnail_b64?: string | null;
}

export interface ScenesResponse {
  shots: ShotDto[];
}

export interface TranscriptSegmentDto {
  index: number;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface TranscribeResponse {
  language: string | null;
  segments: TranscriptSegmentDto[];
}

export interface FaceDto {
  start_ms: number;
  end_ms: number;
  face_count: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
}

export interface FacesResponse {
  detections: FaceDto[];
}

/**
 * HTTP client for the apps/ai-worker Python FastAPI sidecar. Each endpoint
 * is a POST with `{ source_url: presigned GET URL }`. The Python side
 * streams the file from MinIO itself, so the Node process never buffers
 * video bytes — we just shuttle JSON.
 */
@Injectable()
export class AiWorkerClient {
  private readonly logger = new Logger(AiWorkerClient.name);
  private readonly http: AxiosInstance;

  constructor(config: ConfigService) {
    const baseURL =
      config.get<string>('AI_WORKER_URL') ?? 'http://ai-worker:8000';
    this.http = axios.create({
      baseURL,
      // ML inference can be slow on CPU — give it 15 minutes before bailing.
      timeout: 15 * 60 * 1000,
    });
    this.logger.log(`AI worker configured at ${baseURL}`);
  }

  async scenes(sourceUrl: string): Promise<ScenesResponse> {
    return this.call<ScenesResponse>('/scenes', sourceUrl);
  }

  async transcribe(sourceUrl: string): Promise<TranscribeResponse> {
    return this.call<TranscribeResponse>('/transcribe', sourceUrl);
  }

  async faces(sourceUrl: string): Promise<FacesResponse> {
    return this.call<FacesResponse>('/faces', sourceUrl);
  }

  private async call<T>(path: string, sourceUrl: string): Promise<T> {
    try {
      const res = await this.http.post<T>(path, { source_url: sourceUrl });
      return res.data;
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response
          ? `ai-worker ${path} ${err.response.status}: ${JSON.stringify(err.response.data).slice(0, 300)}`
          : err instanceof Error
            ? err.message
            : String(err);
      this.logger.error(message);
      throw new BadGatewayException(message);
    }
  }
}
