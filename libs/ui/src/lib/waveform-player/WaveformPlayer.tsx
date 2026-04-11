import { useCallback, useEffect, useState } from 'react';
import WavesurferPlayer from '@wavesurfer/react';
import type WaveSurfer from 'wavesurfer.js';
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons';
import { useTheme } from '../theme';
import styles from './WaveformPlayer.module.scss';

export interface WaveformPlayerProps {
  src: string;
  height?: number;
  className?: string;
}

// Brand colors from creoTheme — kept in sync with libs/ui/src/lib/theme/theme.ts
const PROGRESS_COLOR = '#2fbc5b'; // creo brand green (colorPrimary)

const WAVE_COLOR_DARK = '#2a4d3a';  // creo colorPrimaryBorder dark — desaturated brand-green
const WAVE_COLOR_LIGHT = '#cbd5e1'; // slate-300 — neutral grey on white

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function WaveformPlayer({ src, height = 28, className }: WaveformPlayerProps) {
  const { mode } = useTheme();
  const waveColor = mode === 'light' ? WAVE_COLOR_LIGHT : WAVE_COLOR_DARK;

  const [wavesurfer, setWavesurfer] = useState<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!wavesurfer) return;
    wavesurfer.setOptions({
      waveColor,
      progressColor: PROGRESS_COLOR,
    });
  }, [wavesurfer, waveColor]);

  const onReady = useCallback((ws: WaveSurfer) => {
    setWavesurfer(ws);
    setIsReady(true);
    setDuration(ws.getDuration());
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (!wavesurfer || !isReady) return;
    wavesurfer.playPause();
  }, [wavesurfer, isReady]);

  return (
    <div className={`${styles.container}${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className={styles.playButton}
        onClick={togglePlay}
        disabled={!isReady}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <PauseOutlined /> : <CaretRightOutlined />}
      </button>

      <div className={styles.waveformWrapper} style={{ height }}>
        <div className={styles.waveform}>
          <WavesurferPlayer
            url={src}
            height={height}
            waveColor={waveColor}
            progressColor={PROGRESS_COLOR}
            cursorColor="transparent"
            barWidth={2}
            barGap={2}
            barRadius={1}
            normalize
            interact
            onReady={onReady}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onFinish={() => setIsPlaying(false)}
            onTimeupdate={(_ws, time) => setCurrentTime(time)}
          />
        </div>
      </div>

      <span className={styles.time}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}
