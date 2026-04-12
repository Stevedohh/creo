import { Collapse, InputNumber, Slider, Typography } from 'antd';
import type { Transform } from '@creo/video-player-data-access';
import styles from './PropertiesPanel.module.scss';

const { Text } = Typography;

interface Props {
  transform: Transform;
  onChange: (patch: Partial<Transform>) => void;
}

export const TransformSection = ({ transform, onChange }: Props) => (
  <Collapse
    defaultActiveKey={['transform']}
    ghost
    items={[
      {
        key: 'transform',
        label: <Text className={styles.sectionLabel}>Transform</Text>,
        children: (
          <div className={styles.grid2col}>
            <label className={styles.fieldLabel}>
              X
              <InputNumber
                size="small"
                value={Math.round(transform.x)}
                onChange={(v) => v != null && onChange({ x: v })}
                className={styles.fieldInput}
              />
            </label>
            <label className={styles.fieldLabel}>
              Y
              <InputNumber
                size="small"
                value={Math.round(transform.y)}
                onChange={(v) => v != null && onChange({ y: v })}
                className={styles.fieldInput}
              />
            </label>
            <label className={styles.fieldLabel}>
              W
              <InputNumber
                size="small"
                min={1}
                value={Math.round(transform.width)}
                onChange={(v) => v != null && onChange({ width: v })}
                className={styles.fieldInput}
              />
            </label>
            <label className={styles.fieldLabel}>
              H
              <InputNumber
                size="small"
                min={1}
                value={Math.round(transform.height)}
                onChange={(v) => v != null && onChange({ height: v })}
                className={styles.fieldInput}
              />
            </label>
            <label className={styles.fieldLabel}>
              Rotation
              <Slider
                min={-180}
                max={180}
                step={1}
                value={transform.rotation}
                onChange={(v) => onChange({ rotation: v })}
                className={styles.fieldSlider}
              />
            </label>
            <label className={styles.fieldLabel}>
              Opacity
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={transform.opacity}
                onChange={(v) => onChange({ opacity: v })}
                className={styles.fieldSlider}
              />
            </label>
          </div>
        ),
      },
    ]}
  />
);
