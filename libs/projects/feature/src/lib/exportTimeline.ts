/**
 * In-browser export for a Twick project. We use MediaRecorder to grab
 * whatever the Twick canvas renders during real-time playback, mix audio
 * tracks from every `<video>` element currently on the page via an
 * AudioContext, and ship the result to the user as a WebM download.
 *
 * Real-time means a 60-second timeline takes ~60 seconds to export. For
 * the pet-project scale this is fine; a server-side headless-Chromium
 * path via `@twick/renderer` can be layered on later for batch work.
 *
 * Caveats:
 * - Audio mixing relies on the browser's AudioContext graph — if a
 *   `<video>` was already hooked into an AudioContext by Twick itself
 *   (e.g. for preview), `createMediaElementSource` throws. We catch and
 *   skip those; they'll still play through the default output so the
 *   recording will have SOME audio via the shared destination node.
 * - The output container is `video/webm` with VP9+Opus — browsers all
 *   support playback, most players convert transparently.
 */

export interface ExportTimelineOptions {
  /** Total duration of the timeline in milliseconds. */
  durationMs: number;
  /** Filename hint for the download. */
  filename?: string;
  /** Frame rate for captureStream. Higher = larger file. */
  fps?: number;
  /** Called with play/seek control hooks once recording is armed. */
  drive: (ctx: { play: () => void; pause: () => void }) => Promise<void>;
  /** Called on each recorded-seconds tick so the UI can show progress. */
  onProgress?: (elapsedMs: number) => void;
}

export interface ExportTimelineResult {
  ok: boolean;
  message: string;
  blob?: Blob;
  filename?: string;
}

export async function exportTimeline(
  options: ExportTimelineOptions,
): Promise<ExportTimelineResult> {
  const { durationMs, filename = 'export.webm', fps = 30, drive, onProgress } = options;

  const canvas = findRenderCanvas();
  if (!canvas) {
    return { ok: false, message: 'Could not find the Twick canvas element.' };
  }

  const videoStream = canvas.captureStream(fps);

  // Pull in the audio tracks. We build an AudioContext and route every
  // video element through it into a MediaStreamDestination, falling back
  // silently if a node is already claimed by Twick.
  const audioCtx = new AudioContext();
  const audioDest = audioCtx.createMediaStreamDestination();
  const audioSources: MediaElementAudioSourceNode[] = [];
  const videoEls = Array.from(
    document.querySelectorAll<HTMLVideoElement>('.studio-container video'),
  );
  for (const el of videoEls) {
    try {
      const source = audioCtx.createMediaElementSource(el);
      source.connect(audioDest);
      source.connect(audioCtx.destination);
      audioSources.push(source);
    } catch {
      // Already attached — skip.
    }
  }

  const combined = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  const mimeType = pickSupportedMime();
  const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const finished = new Promise<ExportTimelineResult>((resolve) => {
    recorder.onstop = () => {
      try {
        audioCtx.close().catch(() => undefined);
      } catch {
        // ignore
      }
      const blob = new Blob(chunks, { type: mimeType ?? 'video/webm' });
      resolve({ ok: true, message: 'Exported', blob, filename });
    };
    recorder.onerror = (ev) => {
      resolve({
        ok: false,
        message:
          'MediaRecorder error: ' +
          ((ev as unknown as { error?: Error }).error?.message ?? 'unknown'),
      });
    };
  });

  recorder.start(200);

  const startedAt = performance.now();
  let progressTimer: ReturnType<typeof setInterval> | null = null;
  if (onProgress) {
    progressTimer = setInterval(() => {
      const elapsed = performance.now() - startedAt;
      onProgress(Math.min(elapsed, durationMs));
    }, 200);
  }

  try {
    await drive({
      play: () => undefined,
      pause: () => undefined,
    });
    // Safety: wait for the full duration regardless of whether the player
    // auto-stops at the end.
    const remaining = Math.max(0, durationMs - (performance.now() - startedAt));
    if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
  } finally {
    if (progressTimer) clearInterval(progressTimer);
    if (recorder.state !== 'inactive') recorder.stop();
  }

  return finished;
}

function findRenderCanvas(): HTMLCanvasElement | null {
  // Twick's live player renders into a <canvas> inside .canvas-container.
  // Fall back to any canvas under the studio container.
  const selectors = [
    '.studio-container .canvas-container canvas',
    '.twick-editor-canvas-container canvas',
    '.studio-container canvas',
  ];
  for (const sel of selectors) {
    const el = document.querySelector<HTMLCanvasElement>(sel);
    if (el) return el;
  }
  return null;
}

function pickSupportedMime(): string | null {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  for (const m of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return null;
}
