import { useCallback, useState, useEffect, useMemo, type PointerEvent as ReactPointerEvent } from 'react';
import type { Clip, Resolution, Transform } from '@creo/video-player-data-access';
import { useCanvasTransform, type HandleId } from './useCanvasTransform';
import styles from './TransformOverlay.module.scss';

interface Props {
  clip: Clip & { transform: Transform };
  compositionSize: Resolution;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onChange: (patch: Partial<Transform>) => void;
}

const HANDLES: HandleId[] = ['tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'];

/**
 * Compute the actual video viewport inside the container, accounting for
 * aspect-ratio letterboxing (black bars on sides or top/bottom).
 */
function computeVideoViewport(
  container: { width: number; height: number },
  composition: Resolution,
) {
  const containerAspect = container.width / container.height;
  const videoAspect = composition.width / composition.height;

  let videoWidth: number;
  let videoHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (containerAspect > videoAspect) {
    // Container wider than video → letterbox on sides
    videoHeight = container.height;
    videoWidth = videoHeight * videoAspect;
    offsetX = (container.width - videoWidth) / 2;
    offsetY = 0;
  } else {
    // Container taller than video → letterbox top/bottom
    videoWidth = container.width;
    videoHeight = videoWidth / videoAspect;
    offsetX = 0;
    offsetY = (container.height - videoHeight) / 2;
  }

  const scale = videoWidth / composition.width;
  return { offsetX, offsetY, scale };
}

export const TransformOverlay = ({
  clip,
  compositionSize,
  containerRef,
  onChange,
}: Props) => {
  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  const viewport = useMemo(
    () => computeVideoViewport(containerSize, compositionSize),
    [containerSize, compositionSize],
  );

  const { onPointerDown, onPointerMove, onPointerUp } = useCanvasTransform({
    transform: clip.transform,
    compositionSize,
    containerSize,
    onChange,
  });

  const { transform: t } = clip;
  const { scale, offsetX, offsetY } = viewport;

  const domLeft = offsetX + t.x * scale;
  const domTop = offsetY + t.y * scale;
  const domWidth = t.width * scale;
  const domHeight = t.height * scale;

  const wrapHandler = useCallback(
    (handleId: HandleId) => ({
      onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) =>
        onPointerDown(handleId, e),
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    }),
    [onPointerDown, onPointerMove, onPointerUp],
  );

  return (
    <div
      className={styles.overlay}
      style={{
        width: domWidth,
        height: domHeight,
        transform: `translate(${domLeft}px, ${domTop}px) rotate(${t.rotation}deg)`,
        willChange: 'transform',
      }}
    >
      <div className={styles.border} {...wrapHandler('body')} />

      {HANDLES.map((h) => (
        <div
          key={h}
          className={`${styles.handle} ${styles[`handle_${h}`]}`}
          {...wrapHandler(h)}
        />
      ))}

      <div className={styles.rotateHandle} {...wrapHandler('rotate')}>
        <div className={styles.rotateDot} />
      </div>
    </div>
  );
};
