import { Dropdown, type MenuProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEditorStore, type TrackKind } from '@creo/video-player-data-access';
import styles from './AddTrackButton.module.scss';

const items: MenuProps['items'] = [
  { key: 'video', label: 'Video track' },
  { key: 'overlay', label: 'Overlay track' },
  { key: 'audio', label: 'Audio track' },
];

export const AddTrackButton = () => {
  const addTrack = useEditorStore((s) => s.addTrack);

  const onClick: MenuProps['onClick'] = ({ key }) => {
    addTrack(key as TrackKind);
  };

  return (
    <div className={styles.row}>
      <Dropdown menu={{ items, onClick }} trigger={['click']}>
        <button className={styles.addBtn}>
          <PlusOutlined /> Add track
        </button>
      </Dropdown>
    </div>
  );
};
