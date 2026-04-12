export interface Tick {
  seconds: number;
  major: boolean;
}

export const secondsToPx = (seconds: number, zoom: number): number =>
  seconds * zoom;

export const pxToSeconds = (px: number, zoom: number): number =>
  zoom <= 0 ? 0 : px / zoom;

/**
 * Pick a sensible tick step (in seconds) that keeps the ruler readable
 * at the given zoom. Returns { minor, major } where major ticks get
 * labels and minor ticks are thin lines between them.
 */
export const pickTickStep = (zoom: number): { minor: number; major: number } => {
  if (zoom < 30) return { minor: 5, major: 10 };
  if (zoom < 60) return { minor: 1, major: 5 };
  if (zoom < 120) return { minor: 0.5, major: 1 };
  if (zoom < 240) return { minor: 0.25, major: 1 };
  return { minor: 0.1, major: 0.5 };
};

export const computeTicks = (
  durationSeconds: number,
  zoom: number,
): Tick[] => {
  const { minor, major } = pickTickStep(zoom);
  const ticks: Tick[] = [];
  const maxTime = Math.max(durationSeconds + 2, 5);
  // Use integer loop over minor units to avoid float drift.
  const steps = Math.ceil(maxTime / minor);
  for (let i = 0; i <= steps; i++) {
    const seconds = i * minor;
    // Major detection: closest integer multiple of `major` (within a
    // small epsilon to tolerate float noise).
    const isMajor = Math.abs(seconds / major - Math.round(seconds / major)) < 1e-6;
    ticks.push({ seconds, major: isMajor });
  }
  return ticks;
};

export const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '0:00';
  const sign = seconds < 0 ? '-' : '';
  const abs = Math.abs(seconds);
  const m = Math.floor(abs / 60);
  const s = Math.floor(abs % 60);
  const frac = Math.round((abs % 1) * 10);
  if (frac > 0 && abs < 60) {
    return `${sign}${m}:${s.toString().padStart(2, '0')}.${frac}`;
  }
  return `${sign}${m}:${s.toString().padStart(2, '0')}`;
};
