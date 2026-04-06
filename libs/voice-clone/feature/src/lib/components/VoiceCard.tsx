import { useTranslation } from 'react-i18next';
import { AudioOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { Popconfirm, message } from 'antd';
import type { Voice } from '@creo/voice-clone-data-access';
import styles from './VoiceCard.module.scss';

interface VoiceCardProps {
  voice: Voice;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const statusColors: Record<string, string> = {
  active: 'var(--creo-color-primary)',
  deleting: 'var(--creo-color-accent)',
  failed: 'var(--creo-color-danger)',
};

export function VoiceCard({ voice, onDelete, isDeleting }: VoiceCardProps) {
  const { t } = useTranslation();

  const formattedDate = new Date(voice.createdAt).toLocaleDateString();

  const copyVoiceId = () => {
    navigator.clipboard.writeText(voice.minimaxVoiceId);
    message.success(t('voices.copied'));
  };

  return (
    <div className={styles.card}>
      <div className={styles.icon}>
        <AudioOutlined />
      </div>
      <div className={styles.body}>
        <h4 className={styles.name}>{voice.name}</h4>
        <div className={styles.meta}>
          <span className={styles.voiceId}>{voice.minimaxVoiceId}</span>
          <span>·</span>
          <span>{formattedDate}</span>
        </div>
        <div className={styles.status}>
          <span
            className={styles.statusDot}
            style={{ background: statusColors[voice.status] }}
          />
          <span className={styles.statusLabel}>
            {t(`voices.status.${voice.status}`)}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        <button className={styles.iconBtn} onClick={copyVoiceId}>
          <CopyOutlined />
        </button>
        <Popconfirm
          title={t('voices.deleteConfirm')}
          onConfirm={() => onDelete(voice.id)}
          okText={t('voices.yes')}
          cancelText={t('voices.no')}
        >
          <button className={styles.iconBtn} disabled={isDeleting}>
            <DeleteOutlined />
          </button>
        </Popconfirm>
      </div>
    </div>
  );
}
