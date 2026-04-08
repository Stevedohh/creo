import { Injectable } from '@nestjs/common';
import { OpenRouterService, ChatMessage } from './openrouter.service';
import { AiEditDto, AiAction } from './dto/ai-edit.dto';

@Injectable()
export class ScriptsAiService {
  constructor(private readonly openRouter: OpenRouterService) {}

  async process(dto: AiEditDto): Promise<NodeJS.ReadableStream> {
    const messages = this.buildMessages(dto);
    return this.openRouter.streamCompletion(dto.model, messages);
  }

  private buildMessages(dto: AiEditDto): ChatMessage[] {
    if (dto.action === AiAction.REWRITE) {
      return this.buildRewriteMessages(dto);
    }
    return this.buildGenerateMessages(dto);
  }

  private buildRewriteMessages(dto: AiEditDto): ChatMessage[] {
    const system = [
      'You are a professional screenwriter and copywriter.',
      'The user will provide a selected text fragment from their script and optional instructions.',
      'Rewrite ONLY the selected text according to the instructions.',
      'Return ONLY the rewritten text, no explanations or formatting.',
      'Preserve the original language of the text.',
    ].join(' ');

    let userMessage = `Selected text to rewrite:\n\n"${dto.selectedText}"`;

    if (dto.fullContent) {
      userMessage += `\n\nFull script context:\n\n${dto.fullContent}`;
    }

    if (dto.instruction) {
      userMessage += `\n\nInstruction: ${dto.instruction}`;
    }

    return [
      { role: 'system', content: system },
      { role: 'user', content: userMessage },
    ];
  }

  private buildGenerateMessages(dto: AiEditDto): ChatMessage[] {
    const system = [
      'You are a professional screenwriter and copywriter specializing in advertising scripts.',
      'Generate a script based on the user\'s instructions.',
      'Write in a clear, engaging style suitable for video ads.',
      'Use markdown formatting for structure (headings, bold, etc.).',
      'Preserve the language specified in the instructions.',
    ].join(' ');

    let userMessage = dto.instruction || 'Write a compelling advertising script.';

    if (dto.fullContent) {
      userMessage += `\n\nExisting content to continue or expand upon:\n\n${dto.fullContent}`;
    }

    return [
      { role: 'system', content: system },
      { role: 'user', content: userMessage },
    ];
  }
}
