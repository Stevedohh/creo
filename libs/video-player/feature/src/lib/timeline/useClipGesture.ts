import { useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react';
import { useEditorStore, type Clip } from '@creo/video-player-data-access';

export type GestureMode = 'move' | 'resize-left' | 'resize-right';

interface UseClipGestureOptions {
  clipId: string;
  mode: GestureMode;
  getClip: () => Clip | undefined;
}

/**
 * Low-level pointer gesture hook for clip drag and edge-resize.
 * Move mode supports cross-track dragging when the pointer moves
 * vertically over a different track lane.
 */
export const useClipGesture = ({ clipId, mode, getClip }: UseClipGestureOptions) => {
  const startXRef = useRef(0);
  const startClipRef = useRef<Clip | null>(null);
  const activePointerRef = useRef<number | null>(null);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const clip = getClip();
      if (!clip) return;
      startXRef.current = e.clientX;
      startClipRef.current = { ...clip } as Clip;
      activePointerRef.current = e.pointerId;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      useEditorStore.getState().setSelection([clipId]);
    },
    [clipId, getClip],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (activePointerRef.current !== e.pointerId) return;
      const start = startClipRef.current;
      if (!start) return;
      const zoom = useEditorStore.getState().zoom;
      const deltaPx = e.clientX - startXRef.current;
      const deltaSec = deltaPx / zoom;
      const { resizeClip, updateClip } = useEditorStore.getState();
      const MIN = 0.05;

      if (mode === 'move') {
        const duration = start.positionEnd - start.positionStart;
        const nextStart = Math.max(0, start.positionStart + deltaSec);
        updateClip(clipId, (c) => {
          c.positionStart = nextStart;
          c.positionEnd = nextStart + duration;
        });

        // Cross-track: detect which track the pointer is over
        const trackEls = document.querySelectorAll<HTMLElement>('[data-track-id]');
        for (const el of trackEls) {
          const rect = el.getBoundingClientRect();
          if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
            const targetTrackId = el.getAttribute('data-track-id');
            if (targetTrackId && targetTrackId !== start.trackId) {
              useEditorStore.getState().moveClipToTrack(clipId, targetTrackId);
              start.trackId = targetTrackId;
            }
            break;
          }
        }
        return;
      }

      if (mode === 'resize-left') {
        const maxStart = start.positionEnd - MIN;
        const nextPosStart = Math.min(
          maxStart,
          Math.max(0, start.positionStart + deltaSec),
        );
        const actualDelta = nextPosStart - start.positionStart;
        const nextSourceStart = Math.max(0, start.sourceStart + actualDelta);
        resizeClip(clipId, {
          positionStart: nextPosStart,
          sourceStart: nextSourceStart,
        });
        return;
      }

      if (mode === 'resize-right') {
        const minEnd = start.positionStart + MIN;
        const nextPosEnd = Math.max(minEnd, start.positionEnd + deltaSec);
        const actualDelta = nextPosEnd - start.positionEnd;
        const nextSourceEnd = Math.max(
          start.sourceStart + MIN,
          start.sourceEnd + actualDelta,
        );
        resizeClip(clipId, {
          positionEnd: nextPosEnd,
          sourceEnd: nextSourceEnd,
        });
      }
    },
    [clipId, mode],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (activePointerRef.current !== e.pointerId) return;
      activePointerRef.current = null;
      startClipRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore — capture may have been released already
      }
    },
    [],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
};
