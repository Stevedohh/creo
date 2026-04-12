import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Empty, Spin } from '@creo/ui';
import type { MediaAsset } from '@creo/media-library-data-access';
import {
  useAssetAnalysis,
  type AnalysisFace,
  type AnalysisShot,
} from '@creo/video-analysis-data-access';
import styles from './AnalysisDetail.module.scss';

export interface AnalysisDetailProps {
  asset: MediaAsset;
  onBack: () => void;
  onReanalyze: () => void;
}

/**
 * Detailed analysis view for a single asset. Renders three things designed
 * to answer the question "what actually happens inside this video":
 *
 *   1. A full-width TimelineStrip that plots all shots as colored segments
 *      proportional to their duration, with a second lane below for face
 *      coverage. Hovering a shot highlights it; clicking it seeks the
 *      player to that timestamp.
 *   2. A shot grid with real thumbnail previews extracted by the ai-worker
 *      at ~25% into each shot. Clicking a thumbnail also seeks the player.
 *   3. A transcript list (empty when whisper is disabled).
 */
export function AnalysisDetail({ asset, onBack, onReanalyze }: AnalysisDetailProps) {
  const { t } = useTranslation();
  const { data: analysis, isLoading } = useAssetAnalysis(asset.id);

  const durationMs = asset.durationMs ?? 0;

  // Seek is a no-op for now — will be wired to Remotion PlayerRef when
  // analysis is integrated into the /remotion editor.
  const seek = useCallback((_ms: number) => {}, []);

  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={onBack}>
          {t('common.back')}
        </Button>
        <div className={styles.titleArea}>
          <div className={styles.assetName} title={asset.originalName ?? ''}>
            {asset.originalName ?? asset.id.slice(0, 8)}
          </div>
        </div>
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          onClick={onReanalyze}
          disabled={
            analysis?.status === 'queued' || analysis?.status === 'running'
          }
        >
          {t('analysis.run')}
        </Button>
      </div>

      {isLoading || !analysis ? (
        <div className={styles.loading}>
          <Spin />
        </div>
      ) : (
        <div className={styles.content}>
          <StatusBanner status={analysis.status} error={analysis.error} />

          {durationMs > 0 && analysis.shots.length > 0 && (
            <TimelineStrip
              durationMs={durationMs}
              shots={analysis.shots}
              faces={analysis.faces}
              onSeek={seek}
            />
          )}

          <Section
            title={t('analysis.shotsTitle', { count: analysis.shots.length })}
            empty={analysis.shots.length === 0}
            emptyLabel={t('analysis.shotsEmpty')}
          >
            <div className={styles.shotGrid}>
              {analysis.shots.map((shot) => (
                <button
                  key={shot.id}
                  type="button"
                  className={styles.shot}
                  onClick={() => seek(shot.startMs)}
                  title={`${formatMs(shot.startMs)} – ${formatMs(shot.endMs)}`}
                >
                  <div className={styles.shotThumb}>
                    {shot.thumbnailUrl ? (
                      <img src={shot.thumbnailUrl} alt={`Shot ${shot.index + 1}`} loading="lazy" />
                    ) : (
                      <div className={styles.shotPlaceholder}>#{shot.index + 1}</div>
                    )}
                    <div className={styles.shotDurationBadge}>
                      {formatMs(shot.endMs - shot.startMs)}
                    </div>
                  </div>
                  <div className={styles.shotMeta}>
                    <div className={styles.shotIndex}>#{shot.index + 1}</div>
                    <div className={styles.shotTime}>{formatMs(shot.startMs)}</div>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          <Section
            title={t('analysis.facesTitle', { count: analysis.faces.length })}
            empty={analysis.faces.length === 0}
            emptyLabel={t('analysis.facesEmpty')}
          >
            <div className={styles.faceStats}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{analysis.faces.length}</div>
                <div className={styles.statLabel}>{t('analysis.samplesWithFaces')}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>
                  {Math.max(0, ...analysis.faces.map((f) => f.faceCount))}
                </div>
                <div className={styles.statLabel}>{t('analysis.maxFaces')}</div>
              </div>
              {analysis.faces.length > 0 && (
                <div className={styles.stat}>
                  <div className={styles.statValue}>
                    {formatMs(
                      analysis.faces.reduce(
                        (sum, f) => sum + (f.endMs - f.startMs),
                        0,
                      ),
                    )}
                  </div>
                  <div className={styles.statLabel}>{t('analysis.totalFaceTime')}</div>
                </div>
              )}
            </div>
          </Section>

          <Section
            title={t('analysis.transcriptTitle', { count: analysis.transcript.length })}
            empty={analysis.transcript.length === 0}
            emptyLabel={t('analysis.transcriptEmpty')}
          >
            <div className={styles.transcript}>
              {analysis.transcript.map((seg) => (
                <button
                  type="button"
                  key={seg.id}
                  className={styles.segment}
                  onClick={() => seek(seg.startMs)}
                >
                  <div className={styles.segmentTime}>{formatMs(seg.startMs)}</div>
                  <div className={styles.segmentText}>{seg.text}</div>
                </button>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}

interface TimelineStripProps {
  durationMs: number;
  shots: AnalysisShot[];
  faces: AnalysisFace[];
  onSeek: (ms: number) => void;
}

/**
 * Horizontal strip: top lane = shots (alternating colors per shot so the
 * eye can track cuts), bottom lane = face coverage (green bands wherever
 * a face was detected). Each segment is clickable and seeks the player.
 */
function TimelineStrip({ durationMs, shots, faces, onSeek }: TimelineStripProps) {
  const { t } = useTranslation();

  const shotBars = useMemo(
    () =>
      shots.map((shot) => {
        const left = (shot.startMs / durationMs) * 100;
        const width = ((shot.endMs - shot.startMs) / durationMs) * 100;
        const hue = (shot.index * 47) % 360;
        return {
          key: shot.id,
          left,
          width,
          hue,
          shot,
        };
      }),
    [shots, durationMs],
  );

  const faceBars = useMemo(
    () =>
      faces.map((f, i) => ({
        key: `f-${i}-${f.startMs}`,
        left: (f.startMs / durationMs) * 100,
        width: Math.max(0.3, ((f.endMs - f.startMs) / durationMs) * 100),
      })),
    [faces, durationMs],
  );

  return (
    <div className={styles.strip}>
      <div className={styles.stripLabel}>{t('analysis.stripShots')}</div>
      <div className={styles.stripLane}>
        {shotBars.map(({ key, left, width, hue, shot }) => (
          <button
            type="button"
            key={key}
            className={styles.stripShot}
            style={{
              left: `${left}%`,
              width: `${width}%`,
              background: `hsl(${hue}, 60%, 45%)`,
            }}
            onClick={() => onSeek(shot.startMs)}
            title={`#${shot.index + 1} · ${formatMs(shot.startMs)} – ${formatMs(shot.endMs)}`}
          />
        ))}
      </div>

      {faceBars.length > 0 && (
        <>
          <div className={styles.stripLabel}>{t('analysis.stripFaces')}</div>
          <div className={styles.stripLane}>
            {faceBars.map(({ key, left, width }) => (
              <div
                key={key}
                className={styles.stripFace}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  empty: boolean;
  emptyLabel: string;
  children: React.ReactNode;
}

function Section({ title, empty, emptyLabel, children }: SectionProps) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>{title}</div>
      {empty ? (
        <Empty image={false} description={emptyLabel} />
      ) : (
        children
      )}
    </div>
  );
}

function StatusBanner({ status, error }: { status: string; error: string | null }) {
  const { t } = useTranslation();
  if (status === 'done') return null;
  return (
    <div className={styles.banner} data-status={status}>
      <strong>
        {status === 'queued'
          ? t('analysis.statusQueued')
          : status === 'running'
            ? t('analysis.statusRunning')
            : status === 'failed'
              ? t('analysis.statusFailed')
              : t('analysis.statusNone')}
      </strong>
      {error && <div className={styles.bannerError}>{error}</div>}
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms < 0) ms = 0;
  const total = Math.round(ms / 100) / 10;
  const m = Math.floor(total / 60);
  const s = Math.floor(total % 60);
  const d = Math.round((total - Math.floor(total)) * 10);
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}.${d}s`;
}
