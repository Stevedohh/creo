import { Composition } from 'remotion';
// Direct file import (not package entry) — `@creo/video-player-feature`
// also re-exports RemotionPlayerPage which pulls in .module.scss and
// would need a CSS loader in Remotion's internal webpack. The
// composition files are pure React with inline styles, so this path
// keeps Remotion bundling clean.
import { EditorComposition } from '../../../feature/src/lib/remotion/EditorComposition';
import { createEmptyDocument, type EditorDocument } from '@creo/video-player-data-access';
import { calculateEditorMetadata } from './calculateMetadata';

export const EDITOR_COMPOSITION_ID = 'editor';

const defaultDoc: EditorDocument = createEmptyDocument('Preview');

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id={EDITOR_COMPOSITION_ID}
        component={EditorComposition}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ doc: defaultDoc }}
        calculateMetadata={calculateEditorMetadata}
      />
    </>
  );
};
