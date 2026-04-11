import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { DeleteOutlined, UploadOutlined, YoutubeOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Spin, useApp } from '@creo/ui';
import {
  useDeleteMediaAsset,
  useMediaAssets,
  useUploadMediaAsset,
  type MediaAsset,
} from '@creo/media-library-data-access';
import { useIngestJobs, useIngestYoutube, type IngestJob } from '@creo/video-ingest-data-access';
import { formatBytes, formatDuration } from './formatters';
import styles from './MediaLibraryPanel.module.scss';

export interface MediaLibraryPanelProps {
  onAssetClick?: (asset: MediaAsset) => void;
  compact?: boolean;
}

export function MediaLibraryPanel({ onAssetClick, compact }: MediaLibraryPanelProps) {
  const { t } = useTranslation();
  const { data: assets, isLoading } = useMediaAssets();
  const { mutate: upload, isPending: isUploading } = useUploadMediaAsset();
  const { mutate: remove } = useDeleteMediaAsset();
  const { mutate: ingestYoutube, isPending: isIngesting } = useIngestYoutube();
  const { data: ingestJobs } = useIngestJobs();
  const { message, modal } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [ytUrl, setYtUrl] = useState('');
  const queryClient = useQueryClient();
  const seenDoneJobIds = useRef<Set<string>>(new Set());

  const activeIngestJobs = (ingestJobs ?? []).filter(
    (j) => j.status === 'queued' || j.status === 'running',
  );

  // When an ingest job transitions to "done" the worker has already written
  // a new MediaAsset row on the backend, but the media list query was cached
  // before that. Watch for newly-done job ids and invalidate the media
  // query once so the new card pops in without a full page reload.
  useEffect(() => {
    if (!ingestJobs) return;
    const newlyDone = ingestJobs.filter(
      (j) => j.status === 'done' && !seenDoneJobIds.current.has(j.id),
    );
    if (newlyDone.length === 0) return;
    for (const job of newlyDone) seenDoneJobIds.current.add(job.id);
    queryClient.invalidateQueries({ queryKey: ['media'] });
  }, [ingestJobs, queryClient]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setProgressPct(0);
    upload(
      {
        file,
        onProgress: (pct) => setProgressPct(pct),
      },
      {
        onSuccess: () => {
          setProgressPct(null);
          message.success(t('media.uploadSuccess'));
        },
        onError: (err) => {
          setProgressPct(null);
          message.error(
            err instanceof Error ? err.message : t('media.uploadError'),
          );
        },
      },
    );
  };

  const handleYoutubeSubmit = () => {
    const trimmed = ytUrl.trim();
    if (!trimmed) return;
    ingestYoutube(trimmed, {
      onSuccess: () => {
        setYtUrl('');
        message.success(t('media.ingestQueued'));
      },
      onError: (err: unknown) => {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ??
              t('media.ingestError'))
            : t('media.ingestError');
        message.error(msg);
      },
    });
  };

  const handleDelete = (asset: MediaAsset) => {
    modal.confirm({
      title: t('media.deleteConfirm'),
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          remove(asset.id, {
            onSuccess: () => {
              message.success(t('media.deleteSuccess'));
              resolve();
            },
            onError: () => reject(),
          });
        }),
    });
  };

  return (
    <div className={`${styles.panel} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('media.title')}</h3>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={handleUploadClick}
          loading={isUploading}
          size={compact ? 'small' : 'middle'}
        >
          {t('media.upload')}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,image/*"
          hidden
          onChange={handleFileSelected}
        />
      </div>

      {progressPct !== null && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progressPct}%` }}
          />
          <span className={styles.progressLabel}>{progressPct}%</span>
        </div>
      )}

      <div className={styles.youtubeRow}>
        <Input
          placeholder={t('media.youtubePlaceholder')}
          value={ytUrl}
          onChange={(e) => setYtUrl(e.target.value)}
          onPressEnter={handleYoutubeSubmit}
          prefix={<YoutubeOutlined />}
          size="small"
          allowClear
          disabled={isIngesting}
        />
        <Button
          onClick={handleYoutubeSubmit}
          loading={isIngesting}
          disabled={!ytUrl.trim()}
          size="small"
        >
          {t('media.ingest')}
        </Button>
      </div>

      {activeIngestJobs.length > 0 && (
        <div className={styles.jobList}>
          {activeIngestJobs.map((job) => (
            <IngestJobRow key={job.id} job={job} />
          ))}
        </div>
      )}

      {isLoading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : assets && assets.length > 0 ? (
        <div className={styles.grid}>
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => onAssetClick?.(asset)}
              onDelete={() => handleDelete(asset)}
              compact={compact}
            />
          ))}
        </div>
      ) : (
        <Empty description={t('media.empty')} />
      )}
    </div>
  );
}

interface IngestJobRowProps {
  job: IngestJob;
}

function IngestJobRow({ job }: IngestJobRowProps) {
  const { t } = useTranslation();
  const label =
    job.title ??
    job.sourceUrl.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40);
  const statusLabel =
    job.status === 'queued'
      ? t('media.ingestStatusQueued')
      : job.status === 'running'
        ? `${t('media.ingestStatusRunning')} ${job.progress}%`
        : job.status === 'done'
          ? t('media.ingestStatusDone')
          : t('media.ingestStatusFailed');
  return (
    <div className={styles.jobRow} data-status={job.status}>
      <div className={styles.jobInfo}>
        <div className={styles.jobLabel} title={job.sourceUrl}>
          {label}
        </div>
        <div className={styles.jobStatus}>{statusLabel}</div>
      </div>
      <div className={styles.jobProgress}>
        <div
          className={styles.jobProgressFill}
          style={{ width: `${Math.max(5, job.progress)}%` }}
        />
      </div>
    </div>
  );
}

interface AssetCardProps {
  asset: MediaAsset;
  onClick: () => void;
  onDelete: () => void;
  compact?: boolean;
}

function AssetCard({ asset, onClick, onDelete, compact }: AssetCardProps) {
  const { t } = useTranslation();
  const isUploading = asset.status === 'uploading';
  const isFailed = asset.status === 'failed';

  return (
    <div
      className={`${styles.card} ${compact ? styles.cardCompact : ''}`}
      data-status={asset.status}
    >
      <div className={styles.thumb} onClick={onClick}>
        {asset.kind === 'video' && asset.url ? (
          <video src={asset.url} muted playsInline preload="metadata" />
        ) : asset.kind === 'image' && asset.url ? (
          <img src={asset.url} alt={asset.originalName ?? ''} />
        ) : (
          <div className={styles.placeholder}>{asset.kind.toUpperCase()}</div>
        )}
        {isUploading && (
          <div className={styles.overlay}>{t('media.statusUploading')}</div>
        )}
        {isFailed && (
          <div className={styles.overlayError}>{t('media.statusFailed')}</div>
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.name} title={asset.originalName ?? ''}>
          {asset.originalName ?? asset.id.slice(0, 8)}
        </div>
        <div className={styles.sub}>
          {formatDuration(asset.durationMs)} · {formatBytes(asset.storageBytes)}
        </div>
      </div>
      <button
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label={t('common.delete')}
      >
        <DeleteOutlined />
      </button>
    </div>
  );
}
