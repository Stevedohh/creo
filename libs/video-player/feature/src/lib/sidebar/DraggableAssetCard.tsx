import { memo, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import {
  CustomerServiceOutlined,
  FileImageOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { MediaAsset } from '@creo/media-library-data-access';
import styles from './DraggableAssetCard.module.scss';

interface Props {
  asset: MediaAsset;
}

const formatDuration = (ms: number | null): string => {
  if (!ms) return '--:--';
  const seconds = Math.round(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const DraggableAssetCardImpl = ({ asset }: Props) => {
  // Memoize the dnd-kit data payload so the draggable registration
  // stays stable across renders — passing a fresh object each render
  // causes dnd-kit to dispatch context updates that loop.
  const draggableData = useMemo(
    () => ({ kind: 'media-asset' as const, asset }),
    [asset],
  );
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `asset-${asset.id}`,
    data: draggableData,
  });

  const thumb = useMemo(() => {
    if (asset.status !== 'ready' || !asset.url) {
      return (
        <div className={styles.thumbPlaceholder}>
          <PlayCircleOutlined />
        </div>
      );
    }
    if (asset.kind === 'video') {
      return (
        <video
          className={styles.thumbVideo}
          src={asset.url}
          muted
          playsInline
          preload="metadata"
        />
      );
    }
    if (asset.kind === 'image') {
      return (
        <img
          className={styles.thumbImage}
          src={asset.url}
          alt={asset.originalName ?? 'image'}
          loading="lazy"
        />
      );
    }
    return (
      <div className={styles.thumbPlaceholder}>
        <CustomerServiceOutlined />
      </div>
    );
  }, [asset]);

  const kindIcon =
    asset.kind === 'video' ? (
      <PlayCircleOutlined />
    ) : asset.kind === 'image' ? (
      <FileImageOutlined />
    ) : (
      <CustomerServiceOutlined />
    );

  return (
    <div
      ref={setNodeRef}
      className={`${styles.card} ${isDragging ? styles.cardDragging : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className={styles.thumb}>{thumb}</div>
      <div className={styles.meta}>
        <div className={styles.kind}>
          {kindIcon}
          <span>{asset.kind}</span>
        </div>
        <div className={styles.name} title={asset.originalName ?? ''}>
          {asset.originalName ?? 'Untitled'}
        </div>
        <div className={styles.duration}>
          {asset.kind === 'image' ? '—' : formatDuration(asset.durationMs)}
        </div>
      </div>
    </div>
  );
};

export const DraggableAssetCard = memo(DraggableAssetCardImpl);
