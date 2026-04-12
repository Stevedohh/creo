import { useRef } from 'react';
import { Button, Empty, Spin, Typography, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import {
  useMediaAssets,
  useUploadMediaAsset,
} from '@creo/media-library-data-access';
import { DraggableAssetCard } from './DraggableAssetCard';
import styles from './AudioPanel.module.scss';

const { Title } = Typography;

export const AudioPanel = () => {
  const { data: assets, isLoading } = useMediaAssets();
  const upload = useUploadMediaAsset();
  const fileRef = useRef<HTMLInputElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const handleUploadClick = () => fileRef.current?.click();

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    for (const file of files) {
      try {
        await upload.mutateAsync({ file });
        messageApi.success(`Uploaded ${file.name}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        messageApi.error(`Upload failed: ${msg}`);
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const audioAssets = (assets ?? [])
    .filter((a) => a.kind === 'audio')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className={styles.panel}>
      {contextHolder}
      <div className={styles.header}>
        <Title level={5} className={styles.title}>Audio</Title>
        <Button
          type="primary"
          size="small"
          icon={<UploadOutlined />}
          loading={upload.isPending}
          onClick={handleUploadClick}
          title="Upload audio"
        />
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="audio/*"
          className={styles.hiddenInput}
          onChange={handleFilesSelected}
        />
      </div>
      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.center}><Spin /></div>
        ) : audioAssets.length === 0 ? (
          <div className={styles.center}>
            <Empty description="No audio files. Upload audio or generate voiceovers." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div className={styles.list}>
            {audioAssets.map((asset) => (
              <DraggableAssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
