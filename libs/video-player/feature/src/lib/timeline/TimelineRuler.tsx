import { memo, useCallback, useEffect, useRef } from 'react';
import { useEditorStore } from '@creo/video-player-data-access';
import { computeTicks, formatTime, secondsToPx } from './timeScale';
import styles from './TimelineRuler.module.scss';

interface Props {
  zoom: number;
  durationSeconds: number;
  contentWidth: number;
  playhead: number;
}

const ZOOM_MIN = 10;
const ZOOM_MAX = 500;
const ZOOM_SENSITIVITY = 0.15;

const TimelineRulerImpl = ({ zoom, durationSeconds, contentWidth, playhead }: Props) => {
  const ticks = computeTicks(durationSeconds, zoom);
  const ref = useRef<HTMLDivElement>(null);
  const scrubbingRef = useRef(false);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const seekToClientX = useCallback(
    (clientX: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const seconds = x / zoomRef.current;
      useEditorStore.getState().setPlayhead(Math.max(0, seconds));
    },
    [],
  );

  // Native wheel listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentZoom = zoomRef.current;
      const delta = -e.deltaY;
      const factor = 1 + Math.sign(delta) * ZOOM_SENSITIVITY;
      const newZoom = Math.round(
        Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, currentZoom * factor)),
      );
      if (newZoom !== currentZoom) {
        useEditorStore.getState().setZoom(newZoom);
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    scrubbingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    seekToClientX(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    seekToClientX(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    scrubbingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // already released
    }
  };

  return (
    <div
      ref={ref}
      className={styles.ruler}
      style={{ width: contentWidth }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {ticks.map((tick) => (
        <div
          key={tick.seconds}
          className={`${styles.tick} ${tick.major ? styles.major : styles.minor}`}
          style={{ transform: `translateX(${secondsToPx(tick.seconds, zoom)}px)` }}
        >
          {tick.major && <span className={styles.label}>{formatTime(tick.seconds)}</span>}
        </div>
      ))}
      <div
        className={styles.playheadLine}
        style={{ transform: `translateX(${secondsToPx(playhead, zoom)}px)` }}
      />
    </div>
  );
};

export const TimelineRuler = memo(TimelineRulerImpl);
