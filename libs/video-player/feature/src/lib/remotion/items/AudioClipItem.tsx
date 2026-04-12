import { Audio, useVideoConfig } from 'remotion';
import type { AudioClip } from '@creo/video-player-data-access';

interface Props {
  clip: AudioClip;
}

export const AudioClipItem = ({ clip }: Props) => {
  const { fps } = useVideoConfig();
  if (!clip.src) return null;
  return (
    <Audio
      src={clip.src}
      startFrom={Math.round(clip.sourceStart * fps)}
      endAt={Math.round(clip.sourceEnd * fps)}
      volume={clip.muted ? 0 : clip.volume}
      playbackRate={clip.speed}
    />
  );
};
