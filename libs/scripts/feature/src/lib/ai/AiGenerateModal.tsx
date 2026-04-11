import { useState } from 'react';
import { Modal, Select, Input } from '@creo/ui';
import { useTranslation } from 'react-i18next';
import type { AiModel } from '@creo/scripts-data-access';
import styles from './AiGenerateModal.module.scss';

const MODEL_OPTIONS: { value: AiModel; label: string }[] = [
  { value: 'grok', label: 'Grok' },
  { value: 'chatgpt', label: 'ChatGPT' },
];

interface AiGenerateModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (model: AiModel, instruction: string) => void;
  isStreaming: boolean;
}

export function AiGenerateModal({ open, onClose, onGenerate, isStreaming }: AiGenerateModalProps) {
  const { t } = useTranslation();
  const [model, setModel] = useState<AiModel>('grok');
  const [instruction, setInstruction] = useState('');

  const handleOk = () => {
    if (!instruction.trim()) return;
    onGenerate(model, instruction);
    setInstruction('');
  };

  return (
    <Modal
      title={t('scripts.ai.generate')}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      okText={t('scripts.ai.generate')}
      confirmLoading={isStreaming}
    >
      <div className={styles.content}>
        <Select
          value={model}
          onChange={setModel}
          options={MODEL_OPTIONS}
          className={styles.modelSelect}
        />
        <Input.TextArea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={t('scripts.ai.generatePromptPlaceholder')}
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </div>
    </Modal>
  );
}
