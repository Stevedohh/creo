import { AbsoluteFill, Sequence } from 'remotion';
import type {
  Clip,
  EditorDocument,
  VideoClip,
  ImageClip,
  AudioClip,
  TextClip,
} from '@creo/video-player-data-access';
import { VideoClipItem } from './items/VideoClipItem';
import { ImageClipItem } from './items/ImageClipItem';
import { AudioClipItem } from './items/AudioClipItem';
import { TextClipItem } from './items/TextClipItem';

export type EditorCompositionProps = {
  doc: EditorDocument;
} & Record<string, unknown>;

const renderClip = (clip: Clip, fps: number, trackMuted = false) => {
  const from = Math.max(0, Math.round(clip.positionStart * fps));
  const durationInFrames = Math.max(
    1,
    Math.round((clip.positionEnd - clip.positionStart) * fps),
  );
  switch (clip.type) {
    case 'video': {
      const vc = clip as VideoClip;
      const mutedClip = trackMuted ? { ...vc, muted: true } : vc;
      return (
        <Sequence key={clip.id} from={from} durationInFrames={durationInFrames}>
          <VideoClipItem clip={mutedClip} />
        </Sequence>
      );
    }
    case 'image':
      return (
        <Sequence key={clip.id} from={from} durationInFrames={durationInFrames}>
          <ImageClipItem clip={clip as ImageClip} />
        </Sequence>
      );
    case 'audio': {
      const ac = clip as AudioClip;
      const mutedAudio = trackMuted ? { ...ac, muted: true } : ac;
      return (
        <Sequence key={clip.id} from={from} durationInFrames={durationInFrames}>
          <AudioClipItem clip={mutedAudio} />
        </Sequence>
      );
    }
    case 'text':
      return (
        <Sequence key={clip.id} from={from} durationInFrames={durationInFrames}>
          <TextClipItem clip={clip as TextClip} fps={fps} />
        </Sequence>
      );
    default:
      return null;
  }
};

export const EditorComposition = ({ doc }: EditorCompositionProps) => {
  // Render tracks in document order — order defines z-stacking.
  return (
    <AbsoluteFill style={{ backgroundColor: doc.background }}>
      {doc.tracks.map((track) =>
        track.hidden ? null : (
          <AbsoluteFill key={track.id}>
            {track.clips.map((clip) =>
              renderClip(clip, doc.fps, track.muted),
            )}
          </AbsoluteFill>
        ),
      )}
    </AbsoluteFill>
  );
};
