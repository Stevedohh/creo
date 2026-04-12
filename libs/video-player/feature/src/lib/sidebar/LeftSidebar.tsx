import { useState } from 'react';
import {
  CustomerServiceOutlined,
  FontSizeOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons';
import { MediaPanel } from './MediaPanel';
import { TextPanel } from './TextPanel';
import { AudioPanel } from './AudioPanel';
import styles from './LeftSidebar.module.scss';

type TabId = 'media' | 'text' | 'audio';

interface TabDef {
  id: TabId;
  icon: React.ReactNode;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'media', icon: <FolderOpenOutlined />, label: 'Media' },
  { id: 'text', icon: <FontSizeOutlined />, label: 'Text' },
  { id: 'audio', icon: <CustomerServiceOutlined />, label: 'Audio' },
];

export const LeftSidebar = () => {
  const [activeTab, setActiveTab] = useState<TabId>('media');

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            title={tab.label}
            className={`${styles.tabButton} ${
              activeTab === tab.id ? styles.tabActive : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
          </button>
        ))}
      </nav>
      <div className={styles.panelContent}>
        {activeTab === 'media' && <MediaPanel />}
        {activeTab === 'text' && <TextPanel />}
        {activeTab === 'audio' && <AudioPanel />}
      </div>
    </aside>
  );
};
