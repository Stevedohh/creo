import { useEffect, useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import { Spin } from '@creo/ui';
import type { AiModel } from '@creo/scripts-data-access';
import { useVoiceovers } from '@creo/scripts-data-access';
import { AiBubbleMenu } from './ai/AiBubbleMenu';
import { AiGenerateModal } from './ai/AiGenerateModal';
import { useAiEdit } from './ai/useAiEdit';
import {
  UndoOutlined,
  RedoOutlined,
  StarOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { VoiceoverPanel } from './voiceover/VoiceoverPanel';
import styles from './ScriptEditor.module.scss';

interface ScriptEditorProps {
  scriptId: string;
  content: string;
  onUpdate: (content: string) => void;
  onWordCountChange?: (count: number) => void;
  editable?: boolean;
}

export function ScriptEditor({
  scriptId,
  content,
  onUpdate,
  onWordCountChange,
  editable = true,
}: ScriptEditorProps) {
  const { t } = useTranslation();
  const isExternalUpdate = useRef(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [voiceoverOpen, setVoiceoverOpen] = useState(false);
  const autoOpenedRef = useRef(false);
  const selectionRef = useRef<{ from: number; to: number } | null>(null);
  const isGeneratingRef = useRef(false);
  const { streamedContent, isStreaming, execute } = useAiEdit();
  const { data: voiceovers } = useVoiceovers(scriptId);
  const hasVoiceovers = (voiceovers?.length ?? 0) > 0;

  // Auto-open the voiceover panel once on first load if any voiceovers exist.
  useEffect(() => {
    if (autoOpenedRef.current) return;
    if (hasVoiceovers) {
      setVoiceoverOpen(true);
      autoOpenedRef.current = true;
    }
  }, [hasVoiceovers]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: t('scripts.editor.placeholder'),
      }),
    ],
    content: content ? (() => { try { return JSON.parse(content); } catch { return content; } })() : undefined,
    editable,
    onUpdate: ({ editor: ed }) => {
      if (isExternalUpdate.current) return;
      const json = JSON.stringify(ed.getJSON());
      onUpdate(json);
      const text = ed.state.doc.textContent;
      const count = text.trim().split(/\s+/).filter(Boolean).length;
      onWordCountChange?.(count);
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (!editor || !content) return;
    try {
      const parsed = JSON.parse(content);
      const current = editor.getJSON();
      if (JSON.stringify(current) !== JSON.stringify(parsed)) {
        isExternalUpdate.current = true;
        editor.commands.setContent(parsed);
        isExternalUpdate.current = false;
      }
    } catch {
      // skip
    }
  }, [content, editor]);

  // Initial word count
  useEffect(() => {
    if (!editor) return;
    const text = editor.state.doc.textContent;
    const count = text.trim().split(/\s+/).filter(Boolean).length;
    onWordCountChange?.(count);
  }, [editor, onWordCountChange]);

  // AI rewrite completion — replace selected text with animation
  useEffect(() => {
    if (!editor || isStreaming || !streamedContent || !selectionRef.current) return;

    const { from, to } = selectionRef.current;
    selectionRef.current = null;

    // Convert markdown to HTML
    const html = marked.parse(streamedContent) as string;

    editor.chain().focus().deleteRange({ from, to }).run();
    editor.commands.insertContentAt(from, html);
    onUpdate(JSON.stringify(editor.getJSON()));
  }, [isStreaming, streamedContent, editor, onUpdate]);

  // AI generate — stream content into editor in real-time
  useEffect(() => {
    if (!editor || !streamedContent || !isGeneratingRef.current) return;

    isExternalUpdate.current = true;
    const html = marked.parse(streamedContent) as string;
    editor.commands.setContent(html);
    isExternalUpdate.current = false;
  }, [streamedContent, editor]);

  // AI generate completion — save when done
  useEffect(() => {
    if (!editor || isStreaming || !isGeneratingRef.current) return;

    isGeneratingRef.current = false;
    if (streamedContent) {
      onUpdate(JSON.stringify(editor.getJSON()));
    }
  }, [isStreaming, editor, streamedContent, onUpdate]);

  const handleRewrite = useCallback(
    (selectedText: string, model: AiModel, instruction: string) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      selectionRef.current = { from, to };

      execute(scriptId, {
        model,
        action: 'rewrite',
        selectedText,
        fullContent: editor.state.doc.textContent,
        instruction: instruction || undefined,
      });
    },
    [editor, scriptId, execute],
  );

  const handleGenerate = useCallback(
    (model: AiModel, instruction: string) => {
      selectionRef.current = null;
      isGeneratingRef.current = true;
      setGenerateOpen(false);

      execute(scriptId, {
        model,
        action: 'generate',
        fullContent: editor?.state.doc.textContent || undefined,
        instruction,
      });
    },
    [editor, scriptId, execute],
  );

  if (!editor) return null;

  const textLength = editor.state.doc.textContent.length;

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
            type="button"
          >
            <UndoOutlined />
          </button>
          <button
            className={styles.toolBtn}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Shift+Z)"
            type="button"
          >
            <RedoOutlined />
          </button>
        </div>

        <div className={styles.toolSpacer} />

        <button
          className={styles.aiBtn}
          onClick={() => setGenerateOpen(true)}
          disabled={isStreaming}
          type="button"
        >
          <StarOutlined />
          {t('scripts.ai.generate')}
        </button>

        <button
          className={styles.aiBtn}
          onClick={() => setVoiceoverOpen(true)}
          disabled={textLength < 50 && !hasVoiceovers}
          type="button"
        >
          <SoundOutlined />
          {t('voiceover.title')}
        </button>
      </div>

      <div className={styles.editorBody}>
        <div className={styles.editorScroll}>
          <EditorContent editor={editor} className={styles.editor} />

          {isStreaming && isGeneratingRef.current && !streamedContent && (
            <div className={styles.streamingOverlay}>
              <Spin size="large" />
              <span className={styles.streamingOverlayText}>
                {t('scripts.ai.streaming')}
              </span>
            </div>
          )}
        </div>

        {voiceoverOpen && (
          <VoiceoverPanel
            scriptId={scriptId}
            onClose={() => setVoiceoverOpen(false)}
          />
        )}
      </div>

      <AiBubbleMenu
        editor={editor}
        onRewrite={handleRewrite}
        isStreaming={isStreaming}
      />

      <AiGenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerate={handleGenerate}
        isStreaming={isStreaming}
      />
    </div>
  );
}
