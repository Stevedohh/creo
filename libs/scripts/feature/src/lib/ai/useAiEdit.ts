import { useState, useCallback, useRef } from 'react';
import type { AiEditRequest } from '@creo/scripts-data-access';

interface UseAiEditResult {
  streamedContent: string;
  isStreaming: boolean;
  error: string | null;
  execute: (scriptId: string, request: AiEditRequest) => void;
  abort: () => void;
}

function getAccessToken(): string | null {
  return localStorage.getItem('creo_access_token');
}

export function useAiEdit(): UseAiEditResult {
  const [streamedContent, setStreamedContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const execute = useCallback((scriptId: string, request: AiEditRequest) => {
    setStreamedContent('');
    setError(null);
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const token = getAccessToken();

    fetch(`/api/scripts/${scriptId}/ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulated += parsed.content;
                setStreamedContent(accumulated);
              }
              if (parsed.error) {
                setError(parsed.error);
              }
            } catch {
              // skip unparseable
            }
          }
        }

        setIsStreaming(false);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setIsStreaming(false);
        }
      });
  }, []);

  return { streamedContent, isStreaming, error, execute, abort };
}
