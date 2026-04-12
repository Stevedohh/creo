import { useCallback } from 'react';
import type { ImageClip, Transform } from '@creo/video-player-data-access';
import { useEditorStore } from '@creo/video-player-data-access';
import { TransformSection } from './TransformSection';
import { SpeedSection } from './SpeedSection';
import styles from './PropertiesPanel.module.scss';

interface Props {
  clip: ImageClip;
}

export const ImageProperties = ({ clip }: Props) => {
  const updateClip = useEditorStore((s) => s.updateClip);

  const updateTransform = useCallback(
    (patch: Partial<Transform>) => {
      updateClip(clip.id, (c) => {
        if (!('transform' in c)) return;
        Object.assign(c.transform, patch);
      });
    },
    [clip.id, updateClip],
  );

  return (
    <div className={styles.sections}>
      <TransformSection transform={clip.transform} onChange={updateTransform} />
      <SpeedSection
        speed={clip.speed}
        onChange={(v) =>
          updateClip(clip.id, (c) => {
            c.speed = v;
          })
        }
      />
    </div>
  );
};
