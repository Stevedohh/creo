import { useTranslation } from 'react-i18next';
import { Button } from '@creo/ui';
import { StatCard, ContentCard } from '@creo/shell';
import { RiseOutlined, FallOutlined, ThunderboltOutlined, EyeOutlined } from '@ant-design/icons';
import styles from './AnalyticsPage.module.scss';

export function AnalyticsPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>

      <div className={styles.statsGrid}>
        <StatCard
          label={t('analytics.stats.totalViews')}
          value="2.4M"
          trend={{ value: '18%', positive: true }}
          subtitle={t('analytics.stats.vs')}
          icon={<EyeOutlined />}
        />
        <StatCard
          label={t('analytics.stats.engagement')}
          value="67%"
          trend={{ value: '5.2%', positive: true }}
          subtitle={t('analytics.stats.vs')}
          icon={<ThunderboltOutlined />}
        />
        <StatCard
          label={t('analytics.stats.conversion')}
          value="12.8%"
          trend={{ value: '2.1%', positive: false }}
          subtitle={t('analytics.stats.vs')}
          icon={<RiseOutlined />}
        />
        <StatCard
          label={t('analytics.stats.bounceRate')}
          value="24%"
          trend={{ value: '3.4%', positive: true }}
          subtitle={t('analytics.stats.vs')}
          icon={<FallOutlined />}
        />
      </div>

      <div className={styles.chartsGrid}>
        <ContentCard title={t('analytics.viewsOverTime')}>
          <div className={styles.chartPlaceholder}>
            <div className={styles.barChart}>
              {[65, 40, 80, 55, 90, 70, 85, 45, 75, 60, 95, 50].map((h, i) => (
                <div
                  key={i}
                  className={styles.bar}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </ContentCard>

        <ContentCard title={t('analytics.topContent')}>
          <div className={styles.rankList}>
            {[
              { name: 'Summer Sale Video', views: '420K', pct: 85 },
              { name: 'Product Demo #3', views: '312K', pct: 65 },
              { name: 'Behind the Scenes', views: '198K', pct: 42 },
              { name: 'Testimonial Reel', views: '156K', pct: 33 },
              { name: 'Brand Story', views: '134K', pct: 28 },
            ].map((item) => (
              <div key={item.name} className={styles.rankItem}>
                <div className={styles.rankInfo}>
                  <span className={styles.rankName}>{item.name}</span>
                  <span className={styles.rankViews}>{item.views} views</span>
                </div>
                <div className={styles.rankBar}>
                  <div
                    className={styles.rankFill}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>
    </div>
  );
}
