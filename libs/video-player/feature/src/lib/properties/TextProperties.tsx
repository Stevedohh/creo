import { useCallback } from 'react';
import {
  Collapse,
  ColorPicker,
  Input,
  InputNumber,
  Radio,
  Select,
  Slider,
  Typography,
} from 'antd';
import {
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
} from '@ant-design/icons';
import type { TextClip, TextStyle, Transform } from '@creo/video-player-data-access';
import { useEditorStore } from '@creo/video-player-data-access';
import { TransformSection } from './TransformSection';
import { SpeedSection } from './SpeedSection';
import styles from './PropertiesPanel.module.scss';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  clip: TextClip;
}

const FONTS = [
  'Inter',
  'Roboto',
  'Montserrat',
  'Oswald',
  'Playfair Display',
  'Open Sans',
  'Lato',
  'Poppins',
  'Raleway',
  'Arial',
];

const WEIGHTS = [300, 400, 500, 600, 700, 800, 900];

export const TextProperties = ({ clip }: Props) => {
  const updateClip = useEditorStore((s) => s.updateClip);

  const updateStyle = useCallback(
    (patch: Partial<TextStyle>) => {
      updateClip(clip.id, (c) => {
        if (c.type !== 'text') return;
        Object.assign(c.style, patch);
      });
    },
    [clip.id, updateClip],
  );

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
        defaultActiveKey={['text']}
        ghost
        items={[
          {
            key: 'text',
            label: <Text className={styles.sectionLabel}>Text Content</Text>,
            children: (
              <TextArea
                rows={3}
                value={clip.text}
                onChange={(e) =>
                  updateClip(clip.id, (c) => {
                    if (c.type === 'text') c.text = e.target.value;
                  })
                }
                className={styles.textArea}
              />
            ),
          },
        ]}
      />

      <Collapse
        defaultActiveKey={['style']}
        ghost
        items={[
          {
            key: 'style',
            label: <Text className={styles.sectionLabel}>Typography</Text>,
            children: (
              <div className={styles.fields}>
                <label className={styles.fieldLabel}>
                  Font
                  <Select
                    size="small"
                    value={clip.style.fontFamily.split(',')[0].trim()}
                    onChange={(v) => updateStyle({ fontFamily: v })}
                    options={FONTS.map((f) => ({ label: f, value: f }))}
                    className={styles.fieldSelect}
                  />
                </label>
                <div className={styles.grid2col}>
                  <label className={styles.fieldLabel}>
                    Size
                    <InputNumber
                      size="small"
                      min={8}
                      max={500}
                      value={clip.style.fontSize}
                      onChange={(v) => v != null && updateStyle({ fontSize: v })}
                      className={styles.fieldInput}
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    Weight
                    <Select
                      size="small"
                      value={clip.style.fontWeight}
                      onChange={(v) => updateStyle({ fontWeight: v })}
                      options={WEIGHTS.map((w) => ({ label: String(w), value: w }))}
                      className={styles.fieldSelect}
                    />
                  </label>
                </div>
                <div className={styles.grid2col}>
                  <label className={styles.fieldLabel}>
                    Color
                    <ColorPicker
                      size="small"
                      value={clip.style.color}
                      onChange={(_, hex) => updateStyle({ color: hex })}
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    Background
                    <ColorPicker
                      size="small"
                      allowClear
                      value={clip.style.backgroundColor ?? undefined}
                      onChange={(_, hex) =>
                        updateStyle({ backgroundColor: hex || null })
                      }
                    />
                  </label>
                </div>
                <label className={styles.fieldLabel}>
                  Align
                  <Radio.Group
                    size="small"
                    value={clip.style.align}
                    onChange={(e) => updateStyle({ align: e.target.value })}
                    optionType="button"
                    buttonStyle="solid"
                    options={[
                      { label: <AlignLeftOutlined />, value: 'left' },
                      { label: <AlignCenterOutlined />, value: 'center' },
                      { label: <AlignRightOutlined />, value: 'right' },
                    ]}
                  />
                </label>
                <div className={styles.grid2col}>
                  <label className={styles.fieldLabel}>
                    Spacing
                    <InputNumber
                      size="small"
                      value={clip.style.letterSpacing}
                      onChange={(v) =>
                        v != null && updateStyle({ letterSpacing: v })
                      }
                      className={styles.fieldInput}
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    Line H
                    <InputNumber
                      size="small"
                      min={0.5}
                      max={3}
                      step={0.1}
                      value={clip.style.lineHeight}
                      onChange={(v) =>
                        v != null && updateStyle({ lineHeight: v })
                      }
                      className={styles.fieldInput}
                    />
                  </label>
                </div>
              </div>
            ),
          },
        ]}
      />

      <Collapse
        ghost
        items={[
          {
            key: 'fade',
            label: <Text className={styles.sectionLabel}>Fade</Text>,
            children: (
              <div className={styles.grid2col}>
                <label className={styles.fieldLabel}>
                  Fade In
                  <Slider
                    min={0}
                    max={3}
                    step={0.1}
                    value={clip.fadeInSeconds}
                    onChange={(v) =>
                      updateClip(clip.id, (c) => {
                        if (c.type === 'text') c.fadeInSeconds = v;
                      })
                    }
                  />
                </label>
                <label className={styles.fieldLabel}>
                  Fade Out
                  <Slider
                    min={0}
                    max={3}
                    step={0.1}
                    value={clip.fadeOutSeconds}
                    onChange={(v) =>
                      updateClip(clip.id, (c) => {
                        if (c.type === 'text') c.fadeOutSeconds = v;
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
