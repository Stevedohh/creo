export interface Script {
  id: string;
  title: string;
  content: string;
  country: string | null;
  wordCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScriptRequest {
  title: string;
  country?: string;
}

export interface UpdateScriptRequest {
  title?: string;
  content?: string;
  country?: string;
  rating?: number;
}

export type AiModel = 'grok' | 'chatgpt' | 'gemini' | 'sonnet';
export type AiAction = 'rewrite' | 'generate';

export interface AiEditRequest {
  model: AiModel;
  action: AiAction;
  selectedText?: string;
  fullContent?: string;
  instruction?: string;
}
