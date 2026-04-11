import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'node:fs';
import path from 'node:path';

interface MinimaxTtsResponse {
  task_id: string;
  file_id: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface MinimaxTtsQueryResponse {
  task_id: string;
  status: string;
  file_id?: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface MinimaxFileRetrieveResponse {
  file: {
    file_id: number;
    bytes: number;
    filename: string;
    purpose: string;
    download_url: string;
  };
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface MinimaxFileResponse {
  file: {
    file_id: number;
    bytes: number;
    filename: string;
    purpose: string;
  };
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface MinimaxCloneResponse {
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface MinimaxGetVoicesResponse {
  voice_cloning: Array<{
    voice_id: string;
    description: string;
    created_time: number;
  }>;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface MinimaxDeleteVoiceResponse {
  voice_id: string;
  created_time: number;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

@Injectable()
export class MinimaxService {
  private readonly logger = new Logger(MinimaxService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('MINIMAX_API_KEY');
    this.baseUrl = this.configService.getOrThrow<string>('MINIMAX_BASE_URL');
  }

  async uploadFile(filePath: string): Promise<number> {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath), {
      filename: path.basename(filePath),
      contentType: 'audio/mpeg',
    });
    form.append('purpose', 'voice_clone');

    try {
      const response = await axios.post<MinimaxFileResponse>(
        `${this.baseUrl}/files/upload`,
        form,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            ...form.getHeaders(),
          },
          maxContentLength: 20 * 1024 * 1024,
        }
      );

      if (response.data.base_resp.status_code !== 0) {
        throw new Error(response.data.base_resp.status_msg);
      }

      this.logger.log(`File uploaded: file_id=${response.data.file.file_id}`);
      return response.data.file.file_id;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`MiniMax upload failed: ${message}`);
      throw new BadGatewayException(`MiniMax file upload failed: ${message}`);
    }
  }

  async cloneVoice(fileId: number, voiceId: string): Promise<void> {
    try {
      const response = await axios.post<MinimaxCloneResponse>(
        `${this.baseUrl}/voice_clone`,
        {
          file_id: fileId,
          voice_id: voiceId,
          need_noise_reduction: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.base_resp.status_code !== 0) {
        throw new Error(response.data.base_resp.status_msg);
      }

      this.logger.log(`Voice cloned: voice_id=${voiceId}`);
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`MiniMax clone failed: ${message}`);
      throw new BadGatewayException(`MiniMax voice clone failed: ${message}`);
    }
  }

  async getVoices(): Promise<MinimaxGetVoicesResponse['voice_cloning']> {
    try {
      const response = await axios.post<MinimaxGetVoicesResponse>(
        `${this.baseUrl}/get_voice`,
        { voice_type: 'voice_cloning' },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.base_resp.status_code !== 0) {
        throw new Error(response.data.base_resp.status_msg);
      }

      return response.data.voice_cloning ?? [];
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`MiniMax get voices failed: ${message}`);
      throw new BadGatewayException(`MiniMax get voices failed: ${message}`);
    }
  }

  async deleteVoice(voiceId: string): Promise<void> {
    try {
      const response = await axios.post<MinimaxDeleteVoiceResponse>(
        `${this.baseUrl}/delete_voice`,
        { voice_type: 'voice_cloning', voice_id: voiceId },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.base_resp.status_code !== 0) {
        throw new Error(response.data.base_resp.status_msg);
      }

      this.logger.log(`Voice deleted from MiniMax: voice_id=${voiceId}`);
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`MiniMax delete voice failed: ${message}`);
      throw new BadGatewayException(`MiniMax delete voice failed: ${message}`);
    }
  }

  async createTtsTask(text: string, voiceId: string): Promise<{ taskId: string; fileId: string }> {
    try {
      const response = await axios.post<MinimaxTtsResponse>(
        `${this.baseUrl}/t2a_async_v2`,
        {
          model: 'speech-2.8-hd',
          text,
          voice_setting: { voice_id: voiceId, speed: 1, vol: 1 },
          audio_setting: { format: 'mp3', audio_sample_rate: 32000, channel: 1 },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.base_resp.status_code !== 0) {
        throw new Error(response.data.base_resp.status_msg);
      }

      this.logger.log(`TTS task created: task_id=${response.data.task_id}`);
      return { taskId: String(response.data.task_id), fileId: String(response.data.file_id) };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`MiniMax TTS task creation failed: ${message}`);
      throw new BadGatewayException(`MiniMax TTS task creation failed: ${message}`);
    }
  }

  async queryTtsTask(taskId: string): Promise<{ status: string; fileId?: string }> {
    try {
      const response = await axios.get<MinimaxTtsQueryResponse>(
        `${this.baseUrl}/query/t2a_async_query_v2`,
        {
          params: { task_id: taskId },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (response.data.base_resp.status_code !== 0) {
        throw new Error(response.data.base_resp.status_msg);
      }

      return { status: response.data.status, fileId: response.data.file_id ? String(response.data.file_id) : undefined };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`MiniMax TTS query failed: ${message}`);
      throw new BadGatewayException(`MiniMax TTS query failed: ${message}`);
    }
  }

  async getFileUrl(fileId: string): Promise<string> {
    try {
      const response = await axios.get<MinimaxFileRetrieveResponse>(
        `${this.baseUrl}/files/retrieve`,
        {
          params: { file_id: fileId },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (response.data.base_resp.status_code !== 0) {
        throw new Error(response.data.base_resp.status_msg);
      }

      return response.data.file.download_url;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`MiniMax file retrieve failed: ${message}`);
      throw new BadGatewayException(`MiniMax file retrieve failed: ${message}`);
    }
  }

  static sanitizeVoiceId(voiceName: string): string {
    const suffix = Date.now().toString(36).slice(-4);
    let id = voiceName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 15);

    if (!id || !/^[a-z]/.test(id)) {
      id = 'v' + id;
    }

    id = id + suffix;

    while (id.length < 8) {
      id += '0';
    }

    return id;
  }
}
