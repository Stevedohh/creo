import { useRef, useCallback, useMemo, type PointerEvent as ReactPointerEvent } from 'react';
import type { Transform, Resolution } from '@creo/video-player-data-access';

export type HandleId =
  | 'body'
  | 'tl' | 'tr' | 'bl' | 'br'
  | 't' | 'b' | 'l' | 'r'
  | 'rotate';

interface UseCanvasTransformOptions {
  transform: Transform;
  compositionSize: Resolution;
  containerSize: { width: number; height: number };
  onChange: (patch: Partial<Transform>) => void;
}

function computeScale(
  container: { width: number; height: number },
  composition: Resolution,
) {
  const containerAspect = container.width / container.height;
  const videoAspect = composition.width / composition.height;
  if (containerAspect > videoAspect) {
    return container.height / composition.height;
  }
  return container.width / composition.width;
}

export const useCanvasTransform = ({
  transform,
  compositionSize,
  containerSize,
  onChange,
}: UseCanvasTransformOptions) => {
  const activeRef = useRef<{
    handleId: HandleId;
    startX: number;
    startY: number;
    startTransform: Transform;
  } | null>(null);

  const scale = useMemo(
    () => computeScale(containerSize, compositionSize),
    [containerSize, compositionSize],
  );

  const onPointerDown = useCallback(
    (handleId: HandleId, e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      activeRef.current = {
        handleId,
        startX: e.clientX,
        startY: e.clientY,
        startTransform: { ...transform },
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [transform],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const state = activeRef.current;
      if (!state) return;
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const { startTransform: st, handleId } = state;
      // Convert DOM px delta to composition units using uniform scale
      const compDx = scale > 0 ? dx / scale : 0;
      const compDy = scale > 0 ? dy / scale : 0;

      if (handleId === 'body') {
        onChange({ x: st.x + compDx, y: st.y + compDy });
        return;
      }
      if (handleId === 'rotate') {
        // Compute center in DOM space accounting for letterbox offset
        const containerAspect = containerSize.width / containerSize.height;
        const videoAspect = compositionSize.width / compositionSize.height;
        let offsetX = 0;
        let offsetY = 0;
        if (containerAspect > videoAspect) {
          const videoWidth = containerSize.height * videoAspect;
          offsetX = (containerSize.width - videoWidth) / 2;
        } else {
          const videoHeight = containerSize.width / videoAspect;
          offsetY = (containerSize.height - videoHeight) / 2;
        }
        const cx = st.x + st.width / 2;
        const cy = st.y + st.height / 2;
        const domCx = offsetX + cx * scale;
        const domCy = offsetY + cy * scale;
        const angle =
          Math.atan2(e.clientY - domCy, e.clientX - domCx) * (180 / Math.PI) + 90;
        onChange({ rotation: Math.round(angle) });
        return;
      }
      // Resize handles
      let x = st.x;
      let y = st.y;
      let w = st.width;
      let h = st.height;
      if (handleId.includes('l')) { x = st.x + compDx; w = st.width - compDx; }
      if (handleId.includes('r')) { w = st.width + compDx; }
      if (handleId.includes('t')) { y = st.y + compDy; h = st.height - compDy; }
      if (handleId.includes('b')) { h = st.height + compDy; }
      if (w < 10) w = 10;
      if (h < 10) h = 10;
      onChange({ x, y, width: Math.round(w), height: Math.round(h) });
    },
    [compositionSize, containerSize, scale, onChange],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!activeRef.current) return;
      activeRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // already released
      }
    },
    [],
  );

  return { onPointerDown, onPointerMove, onPointerUp };
};
