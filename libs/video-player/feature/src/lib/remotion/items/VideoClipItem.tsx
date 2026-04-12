import { AbsoluteFill, OffthreadVideo, useVideoConfig } from 'remotion';
import type { VideoClip } from '@creo/video-player-data-access';

interface Props {
  clip: VideoClip;
}

export const VideoClipItem = ({ clip }: Props) => {
  const { fps } = useVideoConfig();
  if (!clip.src) return null;
  const startFromFrame = Math.round(clip.sourceStart * fps);
  const endAtFrame = Math.round(clip.sourceEnd * fps);
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
      <OffthreadVideo
        src={clip.src}
        startFrom={startFromFrame}
        endAt={endAtFrame}
        volume={clip.muted ? 0 : clip.volume}
        playbackRate={clip.speed}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </AbsoluteFill>
  );
};
