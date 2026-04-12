import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Empty, Input, Spin, Typography, message } from 'antd';
import { LinkOutlined, LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import {
  useMediaAssets,
  useUploadMediaAsset,
} from '@creo/media-library-data-access';
import { useIngestJobs, useIngestYoutube } from '@creo/video-ingest-data-access';
import { DraggableAssetCard } from './DraggableAssetCard';
import styles from './MediaPanel.module.scss';

const { Title, Text } = Typography;

const YT_REGEX = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//;

export const MediaPanel = () => {
  const { data: assets, isLoading } = useMediaAssets();
  const upload = useUploadMediaAsset();
  const ingest = useIngestYoutube();
  const { data: ingestJobs } = useIngestJobs();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [ytUrl, setYtUrl] = useState('');
  const seenDoneJobIds = useRef<Set<string>>(new Set());

  const activeJobs = (ingestJobs ?? []).filter(
    (j) => j.status === 'queued' || j.status === 'running',
  );

  // When an ingest job finishes, invalidate media query so the new asset appears
  useEffect(() => {
    if (!ingestJobs) return;
    const newlyDone = ingestJobs.filter(
      (j) => j.status === 'done' && !seenDoneJobIds.current.has(j.id),
    );
    if (newlyDone.length === 0) return;
    for (const job of newlyDone) seenDoneJobIds.current.add(job.id);
    queryClient.invalidateQueries({ queryKey: ['media'] });
  }, [ingestJobs, queryClient]);

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

  const handleYoutubeIngest = async () => {
    const url = ytUrl.trim();
    if (!url) return;
    if (!YT_REGEX.test(url)) {
      messageApi.warning('Please enter a valid YouTube URL');
      return;
    }
    try {
      await ingest.mutateAsync(url);
      messageApi.success('YouTube video queued for import');
      setYtUrl('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      messageApi.error(`YouTube import failed: ${msg}`);
    }
  };

  const videoAndImageAssets = (assets ?? [])
    .filter((a) => a.kind !== 'audio')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

  return (
    <div className={styles.panel}>
      {contextHolder}
      <div className={styles.header}>
        <Title level={5} className={styles.title}>Media</Title>
        <Button
          type="primary"
          size="small"
          icon={<UploadOutlined />}
          loading={upload.isPending}
          onClick={handleUploadClick}
          title="Upload media"
        />
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="video/*,image/*"
          className={styles.hiddenInput}
          onChange={handleFilesSelected}
        />
      </div>

      <div className={styles.youtubeRow}>
        <Input
          size="small"
          placeholder="YouTube URL..."
          prefix={<LinkOutlined />}
          value={ytUrl}
          onChange={(e) => setYtUrl(e.target.value)}
          onPressEnter={handleYoutubeIngest}
          allowClear
        />
        <Button
          size="small"
          loading={ingest.isPending}
          disabled={!ytUrl.trim()}
          onClick={handleYoutubeIngest}
        >
          Import
        </Button>
      </div>

      {activeJobs.length > 0 && (
        <div className={styles.ingestProgress}>
          {activeJobs.map((job) => (
            <div key={job.id} className={styles.ingestJob}>
              <LoadingOutlined spin />
              <Text className={styles.ingestText}>
                {job.status === 'queued' ? 'Queued...' : 'Importing...'}
              </Text>
            </div>
          ))}
        </div>
      )}

      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.center}><Spin /></div>
        ) : videoAndImageAssets.length === 0 ? (
          <div className={styles.center}>
            <Empty description="No media yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        ) : (
          <div className={styles.grid}>
            {videoAndImageAssets.map((asset) => (
              <DraggableAssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
