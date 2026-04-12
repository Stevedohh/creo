import { Collapse, Slider, Typography } from 'antd';
import styles from './PropertiesPanel.module.scss';

const { Text } = Typography;

interface Props {
  speed: number;
  onChange: (speed: number) => void;
}

const MARKS = { 0.25: '¼', 0.5: '½', 1: '1×', 2: '2×', 4: '4×' };

export const SpeedSection = ({ speed, onChange }: Props) => (
  <Collapse
    ghost
    items={[
      {
        key: 'speed',
        label: <Text className={styles.sectionLabel}>Speed</Text>,
        children: (
          <div className={styles.speedRow}>
            <Slider
              min={0.25}
              max={4}
              step={0.05}
              marks={MARKS}
              value={speed}
              onChange={onChange}
              className={styles.speedSlider}
            />
            <Text className={styles.speedValue}>{speed.toFixed(2)}×</Text>
          </div>
        ),
      },
    ]}
  />
);
