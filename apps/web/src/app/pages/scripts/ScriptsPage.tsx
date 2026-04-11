import { useTranslation } from 'react-i18next';
import { Button } from '@creo/ui';
import { ContentCard } from '@creo/shell';
import { PlusOutlined, FileTextOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import styles from './ScriptsPage.module.scss';

const mockScripts = [
  { id: 1, title: 'Product Launch Campaign', updated: '2 hours ago', words: 1250, status: 'draft' },
  { id: 2, title: 'Summer Sale Voiceover', updated: '1 day ago', words: 820, status: 'completed' },
  { id: 3, title: 'Tutorial Series Ep. 5', updated: '3 days ago', words: 2100, status: 'in_progress' },
  { id: 4, title: 'Brand Story Narration', updated: '1 week ago', words: 3400, status: 'completed' },
  { id: 5, title: 'Social Media Ads Pack', updated: '2 weeks ago', words: 450, status: 'draft' },
];

const statusColors: Record<string, string> = {
  draft: 'var(--creo-text-tertiary)',
  in_progress: 'var(--creo-color-info)',
  completed: 'var(--creo-color-success)',
};

export function ScriptsPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>

      <div className={styles.scriptGrid}>
        {mockScripts.map((script) => (
          <ContentCard key={script.id}>
            <div className={styles.scriptCard}>
              <div className={styles.scriptIcon}>
                <FileTextOutlined />
              </div>
              <div className={styles.scriptBody}>
                <h4 className={styles.scriptTitle}>{script.title}</h4>
                <div className={styles.scriptMeta}>
                  <span>{script.words} words</span>
                  <span>·</span>
                  <span>{script.updated}</span>
                </div>
                <div className={styles.scriptStatus}>
                  <span
                    className={styles.statusDot}
                    style={{ background: statusColors[script.status] }}
                  />
                  <span className={styles.statusLabel}>
                    {t(`scripts.status.${script.status}`)}
                  </span>
                </div>
              </div>
              <div className={styles.scriptActions}>
                <button className={styles.iconBtn}><EditOutlined /></button>
                <button className={styles.iconBtn}><DeleteOutlined /></button>
              </div>
            </div>
          </ContentCard>
        ))}
      </div>
    </div>
  );
}
