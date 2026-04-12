import { useCallback } from 'react';
import { Collapse, Slider, Switch, Typography } from 'antd';
import type { VideoClip, Transform } from '@creo/video-player-data-access';
import { useEditorStore } from '@creo/video-player-data-access';
import { TransformSection } from './TransformSection';
import { SpeedSection } from './SpeedSection';
import styles from './PropertiesPanel.module.scss';

const { Text } = Typography;

interface Props {
  clip: VideoClip;
}

export const VideoProperties = ({ clip }: Props) => {
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
      <Collapse
        defaultActiveKey={['audio']}
        ghost
        items={[
          {
            key: 'audio',
            label: <Text className={styles.sectionLabel}>Audio</Text>,
            children: (
              <div className={styles.fields}>
                <div className={styles.row}>
                  <Text className={styles.fieldLabel}>Mute</Text>
                  <Switch
                    size="small"
                    checked={clip.muted}
                    onChange={(v) =>
                      updateClip(clip.id, (c) => {
                        if (c.type === 'video') c.muted = v;
                      })
                    }
                  />
                </div>
                <label className={styles.fieldLabel}>
                  Volume
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={clip.volume}
                    disabled={clip.muted}
                    onChange={(v) =>
                      updateClip(clip.id, (c) => {
                        if (c.type === 'video') c.volume = v;
                      })
                    }
                  />
                </label>
              </div>
            ),
          },
        ]}
      />
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
