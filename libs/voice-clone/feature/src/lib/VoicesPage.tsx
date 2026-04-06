import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { message, Spin, Empty, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from '@creo/ui';
import { ContentCard } from '@creo/shell';
import { useVoices, useDeleteVoice } from '@creo/voice-clone-data-access';
import { VoiceCard } from './components/VoiceCard';
import { VoiceCloneForm } from './components/VoiceCloneForm';
import styles from './VoicesPage.module.scss';

export function VoicesPage() {
  const { t } = useTranslation();
  const { data: voices, isLoading } = useVoices();
  const { mutate: deleteVoice, isPending: isDeleting } = useDeleteVoice();
  const [cloneModalOpen, setCloneModalOpen] = useState(false);

  const handleDelete = (id: string) => {
    deleteVoice(id, {
      onSuccess: () => message.success(t('voices.deleteSuccess')),
      onError: () => message.error(t('voices.deleteError')),
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCloneModalOpen(true)}
        >
          {t('voices.cloneNew')}
        </Button>
      </div>

      <Modal
        title={t('voices.cloneTitle')}
        open={cloneModalOpen}
        onCancel={() => setCloneModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <VoiceCloneForm onSuccess={() => setCloneModalOpen(false)} />
      </Modal>

      {isLoading ? (
        <div className={styles.loading}>
          <Spin size="large" />
        </div>
      ) : voices?.length ? (
        <div className={styles.voiceGrid}>
          {voices.map((voice) => (
            <ContentCard key={voice.id}>
              <VoiceCard
                voice={voice}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            </ContentCard>
          ))}
        </div>
      ) : (
        <ContentCard>
          <Empty description={t('voices.empty')} />
        </ContentCard>
      )}
    </div>
  );
}
