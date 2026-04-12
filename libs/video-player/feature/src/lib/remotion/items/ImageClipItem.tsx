import { AbsoluteFill, Img } from 'remotion';
import type { ImageClip } from '@creo/video-player-data-access';

interface Props {
  clip: ImageClip;
}

export const ImageClipItem = ({ clip }: Props) => {
  if (!clip.src) return null;
  const { transform } = clip;
  return (
    <AbsoluteFill
      style={{
        width: transform.width,
        height: transform.height,
        opacity: transform.opacity,
        transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rotation}deg)`,
        zIndex: clip.zIndex,
      }}
    >
      <Img src={clip.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
  );
};
