import {
  Component,
  useEffect,
  useMemo,
  useRef,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { TimelineProvider, useTimelineContext } from '@twick/timeline';
import { LivePlayerProvider } from '@twick/live-player';
import { TwickStudio, DEFAULT_STUDIO_CONFIG } from '@twick/studio';
import {
  fromTwickProjectJson,
  toTwickProjectJson,
  type ProjectTimeline,
} from '@creo/projects-schema';
import { useUpdateProjectTimeline } from '@creo/projects-data-access';
import { AnalysisPanel } from '@creo/video-analysis-feature';
import { CreoMediaPanel } from './CreoMediaPanel';
import '@twick/studio/dist/studio.css';
import '@twick/video-editor/dist/video-editor.css';
import styles from './TwickStudioHost.module.scss';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface TwickStudioHostProps {
  projectId: string;
  initialTimeline: ProjectTimeline;
  onStatusChange?: (status: SaveStatus) => void;
}

const AUTOSAVE_DEBOUNCE_MS = 800;

const CREO_MEDIA_TOOL_ID = 'creo-media';
const CREO_ANALYSIS_TOOL_ID = 'creo-analysis';

export function TwickStudioHost({
  projectId,
  initialTimeline,
  onStatusChange,
}: TwickStudioHostProps) {
  const initialTwick = toTwickProjectJson<Parameters<typeof TimelineProvider>[0]['initialData']>(
    initialTimeline,
  );

  // Merge our custom "Media" tool into Twick's default config. Hides the
  // built-in "Video" tool (which pulls from a public Pexels demo library)
  // and replaces it with our own MediaLibraryPanel wired to user uploads.
  // Lives in useMemo so the object identity is stable across renders
  // (TwickStudio compares by reference when deciding to re-mount panels).
  const studioConfig = useMemo(
    () => ({
      ...DEFAULT_STUDIO_CONFIG,
      hiddenTools: ['video'],
      customTools: [
        {
          id: CREO_MEDIA_TOOL_ID,
          name: 'Media',
          icon: 'Library',
          description: 'Your uploads',
        },
        {
          id: CREO_ANALYSIS_TOOL_ID,
          name: 'Analysis',
          icon: 'Sparkles',
          description: 'Scenes, faces, transcript',
        },
      ],
      // Register our panels under our custom ids. Also map "video" →
      // CreoMediaPanel so Twick's initial selectedTool=video shows our
      // media panel instead of a flash of the (hidden) default.
      customPanels: {
        [CREO_MEDIA_TOOL_ID]: CreoMediaPanel,
        [CREO_ANALYSIS_TOOL_ID]: AnalysisPanel as never,
        video: CreoMediaPanel,
      },
    }),
    [],
  );

  return (
    <div className={styles.host}>
      <StudioErrorBoundary>
        <TimelineProvider
          contextId={`project-${projectId}`}
          initialData={initialTwick}
          analytics={{ enabled: false }}
        >
          <LivePlayerProvider>
            <AutoSaveBridge projectId={projectId} onStatusChange={onStatusChange} />
            <TwickStudio studioConfig={studioConfig} />
          </LivePlayerProvider>
        </TimelineProvider>
      </StudioErrorBoundary>
    </div>
  );
}

interface StudioErrorBoundaryState {
  error: Error | null;
  info: ErrorInfo | null;
}

class StudioErrorBoundary extends Component<
  { children: ReactNode },
  StudioErrorBoundaryState
> {
  override state: StudioErrorBoundaryState = { error: null, info: null };

  static getDerivedStateFromError(error: Error): StudioErrorBoundaryState {
    return { error, info: null };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[TwickStudio] mount failed:', error);
    console.error('[TwickStudio] component stack:', info.componentStack);
    this.setState({ error, info });
  }

  override render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: '#f22a36', fontFamily: 'monospace' }}>
          <h3>Twick studio failed to mount</h3>
          <p>{this.state.error.message}</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

interface AutoSaveBridgeProps {
  projectId: string;
  onStatusChange?: (status: SaveStatus) => void;
}

function AutoSaveBridge({ projectId, onStatusChange }: AutoSaveBridgeProps) {
  const { present, changeLog } = useTimelineContext();
  const { mutate } = useUpdateProjectTimeline();

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedJson = useRef<string | null>(null);
  const presentRef = useRef(present);
  const mutateRef = useRef(mutate);
  const onStatusChangeRef = useRef(onStatusChange);

  presentRef.current = present;
  mutateRef.current = mutate;
  onStatusChangeRef.current = onStatusChange;

  useEffect(() => {
    if (!presentRef.current) return;

    const nextJson = JSON.stringify(fromTwickProjectJson(presentRef.current));

    if (lastSavedJson.current === null) {
      lastSavedJson.current = nextJson;
      return;
    }
    if (nextJson === lastSavedJson.current) return;

    onStatusChangeRef.current?.('saving');
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      mutateRef.current(
        { id: projectId, timeline: JSON.parse(nextJson) },
        {
          onSuccess: () => {
            lastSavedJson.current = nextJson;
            onStatusChangeRef.current?.('saved');
          },
          onError: () => onStatusChangeRef.current?.('error'),
        },
      );
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [changeLog, projectId]);

  useEffect(() => {
    const flushNow = () => {
      if (!presentRef.current || lastSavedJson.current === null) return;
      const nextJson = JSON.stringify(fromTwickProjectJson(presentRef.current));
      if (nextJson === lastSavedJson.current) return;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      mutateRef.current(
        { id: projectId, timeline: JSON.parse(nextJson) },
        {
          onSuccess: () => {
            lastSavedJson.current = nextJson;
            onStatusChangeRef.current?.('saved');
          },
        },
      );
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') flushNow();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      flushNow();
    };
  }, [projectId]);

  return null;
}
