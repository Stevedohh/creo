import { memo, useMemo, useRef } from 'react';
import { useEditorStore, computeDuration } from '@creo/video-player-data-access';
import { TimelineRuler } from './TimelineRuler';
import { TrackLane } from './TrackLane';
import { AddTrackButton } from './AddTrackButton';
import { secondsToPx } from './timeScale';
import styles from './Timeline.module.scss';

export const TRACK_HEADER_WIDTH = 140;

const TimelineImpl = () => {
  const doc = useEditorStore((s) => s.doc);
  const zoom = useEditorStore((s) => s.zoom);
  const playhead = useEditorStore((s) => s.playhead);
  const selection = useEditorStore((s) => s.selection);

  const setSelection = useEditorStore((s) => s.setSelection);
  const scrollRef = useRef<HTMLDivElement>(null);

  const duration = useMemo(() => computeDuration(doc), [doc]);
  const contentWidth = Math.max(800, secondsToPx(Math.max(duration + 5, 10), zoom));

  const onBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelection([]);
    }
  };

  return (
    <div className={styles.timeline}>
      <div className={styles.scroll} ref={scrollRef} onClick={onBackgroundClick}>
        <div className={styles.contentColumn}>
          <div className={styles.rulerRow}>
            <div className={styles.rulerSpacer} />
            <TimelineRuler
              zoom={zoom}
              durationSeconds={duration}
              contentWidth={contentWidth}
              playhead={playhead}
            />
          </div>
          <div className={styles.tracks}>
            {doc.tracks.map((track) => (
              <TrackLane
                key={track.id}
                track={track}
                zoom={zoom}
                contentWidth={contentWidth}
                selectedClipIds={selection.clipIds}
              />
            ))}
            <div
              className={styles.playheadOverlay}
              style={{ transform: `translateX(${TRACK_HEADER_WIDTH + secondsToPx(playhead, zoom)}px)` }}
            />
          </div>
        </div>
      </div>
      <AddTrackButton />
    </div>
  );
};

export const Timeline = memo(TimelineImpl);
