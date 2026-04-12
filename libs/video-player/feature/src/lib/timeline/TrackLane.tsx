import { memo, useCallback, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { Track, TrackPatch } from '@creo/video-player-data-access';
import { useEditorStore } from '@creo/video-player-data-access';
import { TrackHeader } from './TrackHeader';
import { ClipBar } from './ClipBar';
import styles from './TrackLane.module.scss';

interface Props {
  track: Track;
  zoom: number;
  contentWidth: number;
  selectedClipIds: string[];
}

interface DroppableTrackData {
  kind: 'track';
  trackId: string;
  trackKind: Track['kind'];
}

const TrackLaneImpl = ({ track, zoom, contentWidth, selectedClipIds }: Props) => {
  const updateTrack = useEditorStore((s) => s.updateTrack);
  const removeTrack = useEditorStore((s) => s.removeTrack);

  const droppableData = useMemo<DroppableTrackData>(
    () => ({ kind: 'track', trackId: track.id, trackKind: track.kind }),
    [track.id, track.kind],
  );
  const { setNodeRef, isOver } = useDroppable({
    id: `track-${track.id}`,
    data: droppableData,
  });

  const handleUpdateTrack = useCallback(
    (patch: TrackPatch) => updateTrack(track.id, patch),
    [track.id, updateTrack],
  );

  const handleRemoveTrack = useCallback(
    () => removeTrack(track.id),
    [track.id, removeTrack],
  );

  return (
    <div className={`${styles.row} ${track.hidden ? styles.rowHidden : ''}`}>
      <TrackHeader
        track={track}
        onUpdate={handleUpdateTrack}
        onRemove={handleRemoveTrack}
      />
      <div
        ref={setNodeRef}
        className={`${styles.lane} ${isOver ? styles.laneOver : ''} ${
          track.locked ? styles.laneLocked : ''
        }`}
        style={{ width: contentWidth }}
        data-creo-track-lane={track.id}
        data-track-id={track.id}
      >
        {track.clips.map((clip) => (
          <ClipBar
            key={clip.id}
            clip={clip}
            zoom={zoom}
            selected={selectedClipIds.includes(clip.id)}
            locked={track.locked}
          />
        ))}
      </div>
    </div>
  );
};

export const TrackLane = memo(TrackLaneImpl);
