import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Button, Spin, Empty, WaveformPlayer } from '@creo/ui';
import { CloseOutlined, DeleteOutlined, SoundOutlined } from '@ant-design/icons';
import { useVoices } from '@creo/voice-clone-data-access';
import {
  useVoiceovers,
  useCreateVoiceover,
  useDeleteVoiceover,
} from '@creo/scripts-data-access';
import type { Voiceover } from '@creo/scripts-data-access';
import styles from './VoiceoverPanel.module.scss';

interface VoiceoverPanelProps {
  scriptId: string;
  onClose: () => void;
}

export function VoiceoverPanel({ scriptId, onClose }: VoiceoverPanelProps) {
  const { t } = useTranslation();
  const [selectedVoice, setSelectedVoice] = useState<string>();
  const { data: voices } = useVoices();
  const { data: voiceovers, isLoading } = useVoiceovers(scriptId);
  const { mutate: create, isPending: isCreating } = useCreateVoiceover(scriptId);
  const { mutate: remove } = useDeleteVoiceover(scriptId);

  const voiceOptions =
    voices?.map((v) => ({ value: v.id, label: v.name })) ?? [];

  const handleCreate = () => {
    if (!selectedVoice) return;
    create({ voiceId: selectedVoice });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('voiceover.title')}</h3>
        <button className={styles.closeBtn} onClick={onClose} type="button">
          <CloseOutlined />
        </button>
      </div>

      <div className={styles.controls}>
        <Select
          value={selectedVoice}
          onChange={setSelectedVoice}
          options={voiceOptions}
          placeholder={t('voiceover.selectVoice')}
          className={styles.voiceSelect}
        />
        <Button
          type="primary"
          icon={<SoundOutlined />}
          onClick={handleCreate}
          loading={isCreating}
          disabled={!selectedVoice}
        >
          {t('voiceover.generate')}
        </Button>
      </div>

      <div className={styles.list}>
        {isLoading && <Spin />}
        {voiceovers?.length === 0 && !isLoading && (
          <Empty description={t('voiceover.empty')} />
        )}
        {voiceovers?.map((vo) => (
          <VoiceoverCard
            key={vo.id}
            voiceover={vo}
            onDelete={() => remove(vo.id)}
          />
        ))}
      </div>
    </div>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function useElapsedSeconds(startedAt: string, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}

function VoiceoverCard({
  voiceover,
  onDelete,
}: {
  voiceover: Voiceover;
  onDelete: () => void;
}) {
  const { t } = useTranslation();

  const inProgress =
    voiceover.status === 'pending' ||
    voiceover.status === 'processing' ||
    voiceover.status === 'uploading';

  const elapsed = useElapsedSeconds(voiceover.createdAt, inProgress);

  const statusLabel =
    voiceover.status === 'processing' || voiceover.status === 'pending'
      ? t('voiceover.processing')
      : voiceover.status === 'uploading'
        ? t('voiceover.uploading')
        : voiceover.status === 'completed'
          ? t('voiceover.completed')
          : t('voiceover.failed');

  const statusHint =
    voiceover.status === 'pending' || voiceover.status === 'processing'
      ? t('voiceover.hintProcessing')
      : voiceover.status === 'uploading'
        ? t('voiceover.hintUploading')
        : null;

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <SoundOutlined className={styles.cardIcon} />
        <span className={styles.cardVoiceName}>{voiceover.voice.name}</span>
        <span className={styles.cardStatus} data-status={voiceover.status}>
          {statusLabel}
        </span>
        {inProgress && (
          <span className={styles.cardElapsed}>{formatElapsed(elapsed)}</span>
        )}
      </div>

      {statusHint && <div className={styles.cardHint}>{statusHint}</div>}

      {inProgress && (
        <div className={styles.cardLoading}>
          <Spin size="small" />
        </div>
      )}

      {voiceover.status === 'completed' && voiceover.audioUrl && (
        <div className={styles.audioPlayer}>
          <WaveformPlayer src={voiceover.audioUrl} />
        </div>
      )}

      <div className={styles.cardFooter}>
        <span className={styles.cardMeta}>
          {voiceover.characterCount} {t('voiceover.chars')}
        </span>
        <button className={styles.deleteBtn} onClick={onDelete} type="button">
          <DeleteOutlined />
        </button>
      </div>
    </div>
  );
}
