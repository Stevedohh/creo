import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'node:child_process';

export interface ProbeResult {
  durationMs: number | null;
  width: number | null;
  height: number | null;
  mimeType: string | null;
}

/**
 * Thin wrapper around the system `ffprobe` binary (installed inside the API
 * container via docker-compose). Probes a presigned GET URL so the binary
 * can stream the remote object directly from MinIO — no need to pull bytes
 * through the Node process first.
 *
 * If ffprobe crashes, exits non-zero, or we can't parse its JSON, we log and
 * return all-nulls rather than throwing: the asset row still becomes "ready",
 * metadata just stays empty. Tracks can still play back; the editor handles
 * unknown durations.
 */
@Injectable()
export class FfprobeService {
  private readonly logger = new Logger(FfprobeService.name);

  async probe(sourceUrl: string): Promise<ProbeResult> {
    try {
      const raw = await this.run(sourceUrl);
      const data = JSON.parse(raw) as FfprobeRawOutput;

      const videoStream = data.streams?.find((s) => s.codec_type === 'video');
      const audioStream = data.streams?.find((s) => s.codec_type === 'audio');

      const durationSec =
        parseFloat(data.format?.duration ?? '') ||
        parseFloat(videoStream?.duration ?? '') ||
        parseFloat(audioStream?.duration ?? '') ||
        0;
      const durationMs = durationSec > 0 ? Math.round(durationSec * 1000) : null;

      return {
        durationMs,
        width: videoStream?.width ?? null,
        height: videoStream?.height ?? null,
        mimeType: this.guessMimeType(data.format?.format_name),
      };
    } catch (err) {
      this.logger.warn(
        `ffprobe failed for ${sourceUrl}: ${err instanceof Error ? err.message : err}`,
      );
      return { durationMs: null, width: null, height: null, mimeType: null };
    }
  }

  private run(sourceUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn('ffprobe', [
        '-v',
        'error',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        sourceUrl,
      ]);

      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      proc.stderr.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      proc.on('error', (err) => reject(err));
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe exited ${code}: ${stderr.trim()}`));
          return;
        }
        resolve(stdout);
      });
    });
  }

  private guessMimeType(formatName: string | undefined): string | null {
    if (!formatName) return null;
    if (formatName.includes('mp4')) return 'video/mp4';
    if (formatName.includes('webm')) return 'video/webm';
    if (formatName.includes('matroska')) return 'video/x-matroska';
    if (formatName.includes('quicktime')) return 'video/quicktime';
    if (formatName.includes('mp3')) return 'audio/mpeg';
    if (formatName.includes('wav')) return 'audio/wav';
    if (formatName.includes('ogg')) return 'audio/ogg';
    if (formatName.includes('image2') || formatName.includes('png')) return 'image/png';
    if (formatName.includes('jpeg')) return 'image/jpeg';
    return null;
  }
}

interface FfprobeRawStream {
  codec_type?: string;
  width?: number;
  height?: number;
  duration?: string;
}

interface FfprobeRawOutput {
  format?: { duration?: string; format_name?: string };
  streams?: FfprobeRawStream[];
}
