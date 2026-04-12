import { memo, useCallback } from 'react';
import {
  CustomerServiceOutlined,
  FileImageOutlined,
  FontSizeOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useEditorStore, type Clip } from '@creo/video-player-data-access';
import { secondsToPx } from './timeScale';
import { useClipGesture } from './useClipGesture';
import styles from './ClipBar.module.scss';

interface Props {
  clip: Clip;
  zoom: number;
  selected: boolean;
  locked?: boolean;
}

const iconForClip = (type: Clip['type']) => {
  switch (type) {
    case 'video':
      return <PlayCircleOutlined />;
    case 'image':
      return <FileImageOutlined />;
    case 'audio':
      return <CustomerServiceOutlined />;
    case 'text':
      return <FontSizeOutlined />;
  }
};

const labelForClip = (clip: Clip): string => {
  if (clip.type === 'text') return clip.text || 'Text';
  return clip.assetId?.slice(0, 10) ?? clip.type;
};

const ClipBarImpl = ({ clip, zoom, selected, locked }: Props) => {
  const getClip = useCallback(() => {
    const doc = useEditorStore.getState().doc;
    for (const track of doc.tracks) {
      const found = track.clips.find((c) => c.id === clip.id);
      if (found) return found;
    }
    return undefined;
  }, [clip.id]);

  const moveGesture = useClipGesture({ clipId: clip.id, mode: 'move', getClip });
  const leftGesture = useClipGesture({
    clipId: clip.id,
    mode: 'resize-left',
    getClip,
  });
  const rightGesture = useClipGesture({
    clipId: clip.id,
    mode: 'resize-right',
    getClip,
  });

  const left = secondsToPx(clip.positionStart, zoom);
  const width = Math.max(4, secondsToPx(clip.positionEnd - clip.positionStart, zoom));

  const onSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    useEditorStore.getState().setSelection([clip.id]);
  };

  return (
    <div
      className={`${styles.clip} ${styles[`type_${clip.type}`]} ${
        selected ? styles.selected : ''
      }`}
      style={{ transform: `translateX(${left}px)`, width }}
      onMouseDown={onSelect}
    >
      <div
        className={styles.resizeHandle + ' ' + styles.left}
        onPointerDown={leftGesture.onPointerDown}
        onPointerMove={leftGesture.onPointerMove}
        onPointerUp={leftGesture.onPointerUp}
        onPointerCancel={leftGesture.onPointerUp}
      />
      <div
        className={styles.body}
        onPointerDown={moveGesture.onPointerDown}
        onPointerMove={moveGesture.onPointerMove}
        onPointerUp={moveGesture.onPointerUp}
        onPointerCancel={moveGesture.onPointerUp}
      >
        <span className={styles.icon}>{iconForClip(clip.type)}</span>
        <span className={styles.label}>{labelForClip(clip)}</span>
      </div>
      <div
        className={styles.resizeHandle + ' ' + styles.right}
        onPointerDown={rightGesture.onPointerDown}
        onPointerMove={rightGesture.onPointerMove}
        onPointerUp={rightGesture.onPointerUp}
        onPointerCancel={rightGesture.onPointerUp}
      />
    </div>
  );
};

export const ClipBar = memo(ClipBarImpl);
