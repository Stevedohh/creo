import { useTranslation } from 'react-i18next';
import { Button, Title, Text } from '@creo/ui';
import { StatCard, ContentCard } from '@creo/shell';
import {
  AudioOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import styles from './app.module.scss';

export function App() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>

      <div className={styles.statsGrid}>
        <StatCard
          label={t('dashboard.stats.voicesCloned')}
          value="24"
          trend={{ value: '12%', positive: true }}
          subtitle={t('dashboard.stats.thisMonth')}
          icon={<AudioOutlined />}
        />
        <StatCard
          label={t('dashboard.stats.videosCreated')}
          value="156"
          trend={{ value: '8.3%', positive: true }}
          subtitle={t('dashboard.stats.thisMonth')}
          icon={<VideoCameraOutlined />}
        />
        <StatCard
          label={t('dashboard.stats.scripts')}
          value="42"
          trend={{ value: '3%', positive: false }}
          subtitle={t('dashboard.stats.thisMonth')}
          icon={<FileTextOutlined />}
        />
        <StatCard
          label={t('dashboard.stats.assets')}
          value="1,280"
          trend={{ value: '24%', positive: true }}
          subtitle={t('dashboard.stats.total')}
          icon={<PictureOutlined />}
        />
      </div>

      <div className={styles.contentGrid}>
        <ContentCard title={t('dashboard.recentProjects')}>
          <div className={styles.projectList}>
            {['Summer Campaign', 'Product Launch v2', 'Social Ads Q2'].map((name) => (
              <div key={name} className={styles.projectItem}>
                <div className={styles.projectIcon}>
                  <VideoCameraOutlined />
                </div>
                <div className={styles.projectInfo}>
                  <span className={styles.projectName}>{name}</span>
                  <span className={styles.projectMeta}>3 videos · 2 voices</span>
                </div>
                <Button size="small">{t('dashboard.open')}</Button>
              </div>
            ))}
          </div>
        </ContentCard>

        <ContentCard title={t('dashboard.quickActions')}>
          <div className={styles.actionGrid}>
            <button className={styles.actionBtn}>
              <AudioOutlined className={styles.actionIcon} />
              <span>{t('dashboard.actions.cloneVoice')}</span>
            </button>
            <button className={styles.actionBtn}>
              <VideoCameraOutlined className={styles.actionIcon} />
              <span>{t('dashboard.actions.lipSync')}</span>
            </button>
            <button className={styles.actionBtn}>
              <FileTextOutlined className={styles.actionIcon} />
              <span>{t('dashboard.actions.writeScript')}</span>
            </button>
            <button className={styles.actionBtn}>
              <PictureOutlined className={styles.actionIcon} />
              <span>{t('dashboard.actions.browseAssets')}</span>
            </button>
          </div>
        </ContentCard>
      </div>

      <ContentCard
        title={t('dashboard.community')}
        variant="accent"
      >
        <div className={styles.communityBanner}>
          <div>
            <Title level={3}>
              {t('dashboard.communityTitle')}
            </Title>
            <Text>
              {t('dashboard.communityDesc')}
            </Text>
          </div>
          <Button type="primary" size="large">
            {t('dashboard.joinNow')}
          </Button>
        </div>
      </ContentCard>
    </div>
  );
}

export default App;
