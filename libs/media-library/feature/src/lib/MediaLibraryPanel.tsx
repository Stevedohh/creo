import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Empty, Spin, useApp } from '@creo/ui';
import {
  useDeleteMediaAsset,
  useMediaAssets,
  useUploadMediaAsset,
  type MediaAsset,
} from '@creo/media-library-data-access';
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
  const { message, modal } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progressPct, setProgressPct] = useState<number | null>(null);

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
