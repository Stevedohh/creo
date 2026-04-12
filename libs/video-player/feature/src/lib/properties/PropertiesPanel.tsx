import { useMemo } from 'react';
import { Tag, Typography } from 'antd';
import {
  useEditorStore,
  getClipById,
  type Clip,
  type TextClip,
  type VideoClip,
  type ImageClip,
  type AudioClip,
  type Resolution,
} from '@creo/video-player-data-access';
import { TextProperties } from './TextProperties';
import { VideoProperties } from './VideoProperties';
import { ImageProperties } from './ImageProperties';
import { AudioProperties } from './AudioProperties';
import styles from './PropertiesPanel.module.scss';

const { Text } = Typography;

const TYPE_LABELS: Record<Clip['type'], string> = {
  video: 'VIDEO',
  image: 'IMAGE',
  audio: 'AUDIO',
  text: 'TEXT',
};

const TYPE_COLORS: Record<Clip['type'], string> = {
  video: 'blue',
  image: 'cyan',
  audio: 'green',
  text: 'magenta',
};

interface ResolutionPreset {
  label: string;
  description: string;
  resolution: Resolution;
}

const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: 'Landscape 1080p', description: '1920 × 1080', resolution: { width: 1920, height: 1080 } },
  { label: 'Landscape 720p', description: '1280 × 720', resolution: { width: 1280, height: 720 } },
  { label: 'Landscape 4K', description: '3840 × 2160', resolution: { width: 3840, height: 2160 } },
  { label: 'Portrait / Reels', description: '1080 × 1920', resolution: { width: 1080, height: 1920 } },
  { label: 'Square', description: '1080 × 1080', resolution: { width: 1080, height: 1080 } },
  { label: 'Portrait 4:5', description: '1080 × 1350', resolution: { width: 1080, height: 1350 } },
];

const ProjectSettings = () => {
  const resolution = useEditorStore((s) => s.doc.resolution);
  const setResolution = useEditorStore((s) => s.setResolution);

  return (
    <div className={styles.scrollBody}>
      <div className={styles.projectSection}>
        <Text className={styles.sectionLabel}>Resolution</Text>
        <div className={styles.currentRes}>
          {resolution.width} × {resolution.height}
        </div>
        <div className={styles.presetGrid}>
          {RESOLUTION_PRESETS.map((preset) => {
            const isActive =
              preset.resolution.width === resolution.width &&
              preset.resolution.height === resolution.height;
            return (
              <button
                key={preset.label}
                className={`${styles.presetBtn} ${isActive ? styles.presetActive : ''}`}
                onClick={() => setResolution(preset.resolution)}
              >
                <span className={styles.presetLabel}>{preset.label}</span>
                <span className={styles.presetDesc}>{preset.description}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const PropertiesPanel = () => {
  const doc = useEditorStore((s) => s.doc);
  const selection = useEditorStore((s) => s.selection);

  const selectedClip = useMemo(() => {
    const id = selection.clipIds[0];
    if (!id) return null;
    const result = getClipById(doc, id);
    return result?.clip ?? null;
  }, [doc, selection.clipIds]);

  if (!selectedClip) {
    return (
      <aside className={styles.panel}>
        <div className={styles.header}>
          <Text className={styles.sectionLabel}>Project Settings</Text>
        </div>
        <ProjectSettings />
      </aside>
    );
  }

  const duration = selectedClip.positionEnd - selectedClip.positionStart;

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <Tag color={TYPE_COLORS[selectedClip.type]}>
          {TYPE_LABELS[selectedClip.type]}
        </Tag>
        <Text className={styles.timing}>
          {`${selectedClip.positionStart.toFixed(2)}s — ${selectedClip.positionEnd.toFixed(2)}s (${duration.toFixed(2)}s)`}
        </Text>
      </div>
      <div className={styles.scrollBody}>
        {selectedClip.type === 'text' && (
          <TextProperties clip={selectedClip as TextClip} />
        )}
        {selectedClip.type === 'video' && (
          <VideoProperties clip={selectedClip as VideoClip} />
        )}
        {selectedClip.type === 'image' && (
          <ImageProperties clip={selectedClip as ImageClip} />
        )}
        {selectedClip.type === 'audio' && (
          <AudioProperties clip={selectedClip as AudioClip} />
        )}
      </div>
    </aside>
  );
};
