import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { YoutubeOutlined } from '@ant-design/icons';
import { Input, Modal, useApp } from '@creo/ui';
import { useIngestYoutube } from '@creo/video-ingest-data-access';
import styles from './YoutubeIngestModal.module.scss';

export interface YoutubeIngestModalProps {
  open: boolean;
  onClose: () => void;
}

export function YoutubeIngestModal({ open, onClose }: YoutubeIngestModalProps) {
  const { t } = useTranslation();
  const { message } = useApp();
  const [url, setUrl] = useState('');
  const { mutate: ingest, isPending } = useIngestYoutube();

  const handleClose = () => {
    if (!isPending) {
      setUrl('');
      onClose();
    }
  };

  const handleSubmit = () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    ingest(trimmed, {
      onSuccess: () => {
        message.success(t('media.ingestQueued'));
        setUrl('');
        onClose();
      },
      onError: (err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? ((err as { response?: { data?: { message?: string } } }).response
                ?.data?.message ?? t('media.ingestError'))
            : t('media.ingestError');
        message.error(msg);
      },
    });
  };

  return (
    <Modal
      title={t('media.youtubeImport')}
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText={t('media.ingest')}
      okButtonProps={{ disabled: !url.trim() || isPending, loading: isPending }}
      destroyOnHidden
    >
      <div className={styles.content}>
        <Input
          placeholder={t('media.youtubePlaceholder')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleSubmit}
          prefix={<YoutubeOutlined />}
          allowClear
          disabled={isPending}
          size="large"
        />
      </div>
    </Modal>
  );
}
