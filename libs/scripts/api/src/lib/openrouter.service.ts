import { Injectable, Logger, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AiModel } from './dto/ai-edit.dto';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const MODEL_MAP: Record<AiModel, string> = {
  [AiModel.GROK]: 'x-ai/grok-3',
  [AiModel.CHATGPT]: 'openai/gpt-4o',
  [AiModel.GEMINI]: 'google/gemini-2.5-pro',
  [AiModel.SONNET]: 'anthropic/claude-sonnet-4-20250514',
};

@Injectable()
export class OpenRouterService {
  private readonly logger = new Logger(OpenRouterService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.getOrThrow<string>('OPENROUTER_API_KEY');
    this.baseUrl = this.configService.get<string>(
      'OPENROUTER_BASE_URL',
      'https://openrouter.ai/api/v1',
    );
  }

  async streamCompletion(
    model: AiModel,
    messages: ChatMessage[],
  ): Promise<NodeJS.ReadableStream> {
    const modelId = MODEL_MAP[model];

    try {
      this.logger.log(`Streaming completion with model: ${modelId}`);

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: modelId,
          messages,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`OpenRouter stream failed: ${message}`);
      throw new BadGatewayException(`OpenRouter request failed: ${message}`);
    }
  }
}

export type { ChatMessage };
