import { useState, useCallback } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { Select, Input, Popover } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  StarOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Button } from '@creo/ui';
import { useTranslation } from 'react-i18next';
import type { AiModel } from '@creo/scripts-data-access';
import styles from './AiBubbleMenu.module.scss';

const MODEL_OPTIONS: { value: AiModel; label: string }[] = [
  { value: 'sonnet', label: 'Claude Sonnet' },
  { value: 'chatgpt', label: 'ChatGPT' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'grok', label: 'Grok' },
];

interface AiBubbleMenuProps {
  editor: Editor;
  onRewrite: (selectedText: string, model: AiModel, instruction: string) => void;
  isStreaming: boolean;
}

export function AiBubbleMenu({ editor, onRewrite, isStreaming }: AiBubbleMenuProps) {
  const { t } = useTranslation();
  const [model, setModel] = useState<AiModel>('sonnet');
  const [instruction, setInstruction] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Reactive state — re-renders when selection/marks change
  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isStrike: ctx.editor.isActive('strike'),
      isUnderline: ctx.editor.isActive('underline'),
      isH1: ctx.editor.isActive('heading', { level: 1 }),
      isH2: ctx.editor.isActive('heading', { level: 2 }),
      isH3: ctx.editor.isActive('heading', { level: 3 }),
    }),
  });

  const handleRewrite = useCallback(() => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText.trim()) return;

    onRewrite(selectedText, model, instruction);
    setInstruction('');
    setPopoverOpen(false);
  }, [editor, model, instruction, onRewrite]);

  const aiPopoverContent = (
    <div className={styles.popoverContent}>
      <Select
        value={model}
        onChange={setModel}
        options={MODEL_OPTIONS}
        className={styles.modelSelect}
        size="small"
      />
      <Input.TextArea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder={t('scripts.ai.instructionPlaceholder')}
        autoSize={{ minRows: 2, maxRows: 4 }}
        onPressEnter={(e) => {
          if (!e.shiftKey) {
            e.preventDefault();
            handleRewrite();
          }
        }}
      />
      <Button
        type="primary"
        size="small"
        icon={<SendOutlined />}
        onClick={handleRewrite}
        loading={isStreaming}
      >
        {t('scripts.ai.rewrite')}
      </Button>
    </div>
  );

  const btn = (active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      className={`${styles.btn} ${active ? styles.btnActive : ''}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <BubbleMenu editor={editor}>
      <div className={styles.menu}>
        <div className={styles.group}>
          {btn(editorState.isBold, () => editor.chain().focus().toggleBold().run(), <BoldOutlined />)}
          {btn(editorState.isItalic, () => editor.chain().focus().toggleItalic().run(), <ItalicOutlined />)}
          {btn(editorState.isStrike, () => editor.chain().focus().toggleStrike().run(), <StrikethroughOutlined />)}
          {btn(editorState.isUnderline, () => editor.chain().focus().toggleUnderline().run(), <UnderlineOutlined />)}
        </div>

        <div className={styles.sep} />

        <div className={styles.group}>
          {btn(editorState.isH1, () => editor.chain().focus().toggleHeading({ level: 1 }).run(), 'H1')}
          {btn(editorState.isH2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'H2')}
          {btn(editorState.isH3, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'H3')}
        </div>

        <div className={styles.sep} />

        <Popover
          content={aiPopoverContent}
          trigger="click"
          open={popoverOpen}
          onOpenChange={(open) => {
            setPopoverOpen(open);
            if (!open) setInstruction('');
          }}
          placement="top"
        >
          <button
            className={styles.aiBtn}
            type="button"
            disabled={isStreaming}
          >
            <StarOutlined />
            <span>{t('scripts.ai.rewrite')}</span>
          </button>
        </Popover>
      </div>
    </BubbleMenu>
  );
}
