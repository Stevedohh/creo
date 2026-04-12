import { memo } from 'react';
import { Popconfirm } from 'antd';
import {
  AudioOutlined,
  CloseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LayoutOutlined,
  LockOutlined,
  SoundOutlined,
  UnlockOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import type { Track, TrackPatch } from '@creo/video-player-data-access';
import styles from './TrackHeader.module.scss';

interface Props {
  track: Track;
  onUpdate: (patch: TrackPatch) => void;
  onRemove: () => void;
}

const iconForTrack = (kind: Track['kind']) => {
  switch (kind) {
    case 'video':
      return <VideoCameraOutlined />;
    case 'audio':
      return <AudioOutlined />;
    case 'overlay':
      return <LayoutOutlined />;
  }
};

const TrackHeaderImpl = ({ track, onUpdate, onRemove }: Props) => {
  return (
    <div className={styles.header}>
      <div className={styles.nameRow}>
        <span className={styles.icon}>{iconForTrack(track.kind)}</span>
        <span className={styles.name}>{track.name}</span>
      </div>
      <div className={styles.controls}>
        <button
          title={track.muted ? 'Unmute' : 'Mute'}
          className={`${styles.controlBtn} ${track.muted ? styles.active : ''}`}
          onClick={() => onUpdate({ muted: !track.muted })}
        >
          {track.muted ? <SoundOutlined /> : <SoundOutlined />}
        </button>
        <button
          title={track.hidden ? 'Show' : 'Hide'}
          className={`${styles.controlBtn} ${track.hidden ? styles.active : ''}`}
          onClick={() => onUpdate({ hidden: !track.hidden })}
        >
          {track.hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        </button>
        <button
          title={track.locked ? 'Unlock' : 'Lock'}
          className={`${styles.controlBtn} ${track.locked ? styles.active : ''}`}
          onClick={() => onUpdate({ locked: !track.locked })}
        >
          {track.locked ? <LockOutlined /> : <UnlockOutlined />}
        </button>
        <Popconfirm
          title="Delete track?"
          description={track.clips.length > 0 ? `${track.clips.length} clips will be removed` : undefined}
          onConfirm={onRemove}
          okText="Delete"
          cancelText="Cancel"
        >
          <button title="Remove track" className={styles.controlBtn}>
            <CloseOutlined />
          </button>
        </Popconfirm>
      </div>
    </div>
  );
};

export const TrackHeader = memo(TrackHeaderImpl);
