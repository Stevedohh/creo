import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum AiModel {
  GROK = 'grok',
  CHATGPT = 'chatgpt',
  GEMINI = 'gemini',
  SONNET = 'sonnet',
}

export enum AiAction {
  REWRITE = 'rewrite',
  GENERATE = 'generate',
}

export class AiEditDto {
  @IsEnum(AiModel)
  model!: AiModel;

  @IsEnum(AiAction)
  action!: AiAction;

  @IsOptional()
  @IsString()
  selectedText?: string;

  @IsOptional()
  @IsString()
  fullContent?: string;

  @IsOptional()
  @IsString()
  instruction?: string;
}
