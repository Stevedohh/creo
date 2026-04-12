import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Empty, Spin, useApp } from '@creo/ui';
import { useMediaAssets, type MediaAsset } from '@creo/media-library-data-access';
import { useEnqueueAnalysis } from '@creo/video-analysis-data-access';
import { AnalysisDetail } from './AnalysisDetail';
import styles from './AnalysisPanel.module.scss';

/**
 * Analysis panel for video assets. Mirrors the MediaLibraryPanel
 * layout: grid of user-owned video assets, but each card surfaces the
 * current analysis status and a click opens a detail view with shots,
 * faces, and transcript segments. Designed to live in the left rail next
 * to Media so users can flip between "pick a clip" and "inspect what's
 * inside this clip" without leaving the editor.
 */
export function AnalysisPanel() {
  const { t } = useTranslation();
  const { data: assets, isLoading } = useMediaAssets();
  const { mutate: enqueue } = useEnqueueAnalysis();
  const { message } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const videos = (assets ?? []).filter((a) => a.kind === 'video');

  const handleRunAnalysis = (asset: MediaAsset) => {
    enqueue(asset.id, {
      onSuccess: () => message.success(t('analysis.queued')),
      onError: () => message.error(t('analysis.queueError')),
    });
  };

  if (selectedId) {
    const asset = videos.find((a) => a.id === selectedId);
    if (asset) {
      return (
        <AnalysisDetail
          asset={asset}
          onBack={() => setSelectedId(null)}
          onReanalyze={() => handleRunAnalysis(asset)}
        />
      );
    }
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>{t('analysis.title')}</h3>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : videos.length > 0 ? (
        <div className={styles.grid}>
          {videos.map((asset) => (
            <AnalysisCard
              key={asset.id}
              asset={asset}
              onOpen={() => setSelectedId(asset.id)}
              onRun={() => handleRunAnalysis(asset)}
            />
          ))}
        </div>
      ) : (
        <Empty description={t('analysis.empty')} />
      )}
    </div>
  );
}

interface AnalysisCardProps {
  asset: MediaAsset;
  onOpen: () => void;
  onRun: () => void;
}

function AnalysisCard({ asset, onOpen, onRun }: AnalysisCardProps) {
  const { t } = useTranslation();
  const status = asset.analysisStatus ?? 'none';
  const isBusy = status === 'queued' || status === 'running';

  const statusLabel =
    status === 'queued'
      ? t('analysis.statusQueued')
      : status === 'running'
        ? t('analysis.statusRunning')
        : status === 'done'
          ? t('analysis.statusDone')
          : status === 'failed'
            ? t('analysis.statusFailed')
            : t('analysis.statusNone');

  return (
    <div className={styles.card} data-status={status}>
      <div className={styles.thumb} onClick={onOpen}>
        {asset.url ? (
          <video src={asset.url} muted playsInline preload="metadata" />
        ) : (
          <div className={styles.placeholder}>VIDEO</div>
        )}
      </div>
      <div className={styles.meta}>
        <div className={styles.name} title={asset.originalName ?? ''}>
          {asset.originalName ?? asset.id.slice(0, 8)}
        </div>
        <div className={styles.statusRow}>
          <span className={styles.statusBadge} data-status={status}>
            {statusLabel}
          </span>
        </div>
      </div>
      <div className={styles.actions}>
        {status === 'done' && (
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            onClick={onOpen}
          >
            {t('analysis.view')}
          </Button>
        )}
        <Button
          size="small"
          type="text"
          icon={<ReloadOutlined />}
          onClick={onRun}
          disabled={isBusy}
        >
          {t('analysis.run')}
        </Button>
      </div>
    </div>
  );
}
