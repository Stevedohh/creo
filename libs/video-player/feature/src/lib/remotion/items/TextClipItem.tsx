import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import type { TextClip } from '@creo/video-player-data-access';

interface Props {
  clip: TextClip;
  fps: number;
}

export const TextClipItem = ({ clip, fps }: Props) => {
  const frame = useCurrentFrame();
  const fadeInFrames = Math.max(1, Math.round(clip.fadeInSeconds * fps));
  const fadeOutFrames = Math.max(1, Math.round(clip.fadeOutSeconds * fps));
  const totalFrames = Math.round((clip.positionEnd - clip.positionStart) * fps);

  const fadeIn = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(
    frame,
    [totalFrames - fadeOutFrames, totalFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const alpha = Math.min(fadeIn, fadeOut) * clip.transform.opacity;

  const { style, transform } = clip;
  const textStroke =
    style.strokeColor && style.strokeWidth > 0
      ? `${style.strokeWidth}px ${style.strokeColor}`
      : undefined;

  return (
    <AbsoluteFill
      style={{
        width: transform.width,
        height: transform.height,
        opacity: alpha,
        transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg)`,
        zIndex: clip.zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          style.align === 'center' ? 'center' : style.align === 'right' ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          color: style.color,
          backgroundColor: style.backgroundColor ?? undefined,
          letterSpacing: style.letterSpacing,
          lineHeight: style.lineHeight,
          textAlign: style.align,
          padding: style.backgroundColor ? '0.25em 0.5em' : 0,
          WebkitTextStroke: textStroke,
          whiteSpace: 'pre-wrap',
        }}
      >
        {clip.text}
      </div>
    </AbsoluteFill>
  );
};
