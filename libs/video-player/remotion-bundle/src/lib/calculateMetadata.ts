import type { CalculateMetadataFunction } from 'remotion';
import type { EditorDocument } from '@creo/video-player-data-access';
import { computeDuration } from '@creo/video-player-data-access';
import type { EditorCompositionProps } from '../../../feature/src/lib/remotion/EditorComposition';

export const calculateEditorMetadata: CalculateMetadataFunction<EditorCompositionProps> = ({
  props,
}) => {
  const doc: EditorDocument = props.doc;
  const durationSeconds = Math.max(1 / doc.fps, computeDuration(doc));
  return {
    durationInFrames: Math.max(1, Math.round(durationSeconds * doc.fps)),
    fps: doc.fps,
    width: doc.resolution.width,
    height: doc.resolution.height,
  };
};
