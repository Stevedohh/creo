import { useRef } from 'react';
import { Button, Empty, Spin, Typography, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import {
  useMediaAssets,
  useUploadMediaAsset,
} from '@creo/media-library-data-access';
import { DraggableAssetCard } from './DraggableAssetCard';
import styles from './MediaSidebar.module.scss';

const { Title } = Typography;

export const MediaSidebar = () => {
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

  const sortedAssets = (assets ?? []).slice().sort((a, b) => {
    if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <aside className={styles.sidebar}>
      {contextHolder}
      <div className={styles.header}>
        <Title level={5} className={styles.title}>
          Media Library
        </Title>
        <Button
          type="primary"
          size="small"
          icon={<UploadOutlined />}
          loading={upload.isPending}
          onClick={handleUploadClick}
        >
          Upload
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          className={styles.hiddenInput}
          onChange={handleFilesSelected}
        />
      </div>

      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.center}>
            <Spin />
          </div>
        ) : sortedAssets.length === 0 ? (
          <div className={styles.center}>
            <Empty
              description="No media yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div className={styles.grid}>
            {sortedAssets.map((asset) => (
              <DraggableAssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
