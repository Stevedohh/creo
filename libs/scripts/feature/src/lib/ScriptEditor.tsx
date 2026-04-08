import { useEffect, useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useTranslation } from 'react-i18next';
import type { AiModel } from '@creo/scripts-data-access';
import { AiBubbleMenu } from './ai/AiBubbleMenu';
import { AiGenerateModal } from './ai/AiGenerateModal';
import { useAiEdit } from './ai/useAiEdit';
import {
  UndoOutlined,
  RedoOutlined,
  StarOutlined,
} from '@ant-design/icons';
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
  const selectionRef = useRef<{ from: number; to: number } | null>(null);
  const { streamedContent, isStreaming, execute } = useAiEdit();

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

    // Delete old text first
    editor.chain().focus().deleteRange({ from, to }).run();

    // Animate insertion char by char
    let i = 0;
    const text = streamedContent;
    const step = () => {
      if (i >= text.length) {
        // Done — trigger save
        onUpdate(JSON.stringify(editor.getJSON()));
        return;
      }
      const chunk = text.slice(i, i + 3);
      editor.commands.insertContentAt(from + i, chunk);
      i += chunk.length;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isStreaming, streamedContent, editor, onUpdate]);

  // AI generate completion — set whole content
  useEffect(() => {
    if (!editor || isStreaming || !streamedContent || selectionRef.current) return;
    if (!generateOpen) return;

    isExternalUpdate.current = true;
    editor.commands.setContent(streamedContent);
    isExternalUpdate.current = false;
    setGenerateOpen(false);
    onUpdate(JSON.stringify(editor.getJSON()));
  }, [isStreaming, streamedContent, editor, generateOpen, onUpdate]);

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
      execute(scriptId, {
        model,
        action: 'generate',
        fullContent: editor?.state.doc.textContent,
        instruction,
      });
    },
    [editor, scriptId, execute],
  );

  if (!editor) return null;

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

        {isStreaming && (
          <span className={styles.streamingIndicator}>
            {t('scripts.ai.streaming')}
          </span>
        )}
      </div>

      <div className={styles.editorScroll}>
        <EditorContent editor={editor} className={styles.editor} />
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
