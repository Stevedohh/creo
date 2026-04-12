import { useCallback, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Button, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import {
  useEditorStore,
  computeDuration,
  createDefaultTextClip,
  type TextStyle,
} from '@creo/video-player-data-access';
import styles from './TextPanel.module.scss';

const { Title, Text } = Typography;

export interface TextPreset {
  id: string;
  label: string;
  description: string;
  styleOverrides: Partial<TextStyle>;
}

export const TEXT_PRESETS: TextPreset[] = [
  {
    id: 'title',
    label: 'Title',
    description: 'Large bold heading',
    styleOverrides: { fontSize: 120, fontWeight: 800, letterSpacing: -2 },
  },
  {
    id: 'subtitle',
    label: 'Subtitle',
    description: 'Medium weight subheading',
    styleOverrides: { fontSize: 64, fontWeight: 500, letterSpacing: 0 },
  },
  {
    id: 'body',
    label: 'Body',
    description: 'Regular paragraph text',
    styleOverrides: { fontSize: 42, fontWeight: 400, letterSpacing: 0, lineHeight: 1.5 },
  },
  {
    id: 'caption',
    label: 'Caption',
    description: 'Small caption / lower third',
    styleOverrides: {
      fontSize: 36,
      fontWeight: 600,
      backgroundColor: 'rgba(0,0,0,0.6)',
      align: 'left',
      letterSpacing: 1,
    },
  },
  {
    id: 'cta',
    label: 'Call to Action',
    description: 'Bold CTA button style',
    styleOverrides: {
      fontSize: 48,
      fontWeight: 700,
      backgroundColor: '#1677ff',
      color: '#ffffff',
      align: 'center',
      letterSpacing: 2,
    },
  },
];

const DraggablePresetCard = ({ preset, onAdd }: { preset: TextPreset; onAdd: () => void }) => {
  const draggableData = useMemo(
    () => ({ kind: 'text-preset' as const, preset }),
    [preset],
  );
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `text-preset-${preset.id}`,
    data: draggableData,
  });

  return (
    <button
      ref={setNodeRef}
      className={`${styles.presetCard} ${isDragging ? styles.presetDragging : ''}`}
      onClick={onAdd}
      {...attributes}
      {...listeners}
    >
      <div className={styles.presetPreview}>
        <span className={styles.presetLabel}>{preset.label}</span>
      </div>
      <Text className={styles.presetDesc}>{preset.description}</Text>
    </button>
  );
};

export const TextPanel = () => {
  const addClip = useEditorStore((s) => s.addClip);
  const doc = useEditorStore((s) => s.doc);
  const playhead = useEditorStore((s) => s.playhead);

  const handleAddPreset = useCallback(
    (preset: TextPreset) => {
      const overlayTrack = doc.tracks.find((t) => t.kind === 'overlay');
      if (!overlayTrack) return;
      const start = playhead > 0 ? playhead : computeDuration(doc);
      const clip = createDefaultTextClip(overlayTrack.id, start, doc);
      Object.assign(clip.style, preset.styleOverrides);
      clip.text = preset.label;
      addClip(overlayTrack.id, clip);
    },
    [addClip, doc, playhead],
  );

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Title level={5} className={styles.title}>Text</Title>
      </div>
      <div className={styles.body}>
        <div className={styles.presets}>
          {TEXT_PRESETS.map((preset) => (
            <DraggablePresetCard
              key={preset.id}
              preset={preset}
              onAdd={() => handleAddPreset(preset)}
            />
          ))}
        </div>
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          block
          className={styles.addButton}
          onClick={() => handleAddPreset(TEXT_PRESETS[0])}
        >
          Add text clip
        </Button>
      </div>
    </div>
  );
};
