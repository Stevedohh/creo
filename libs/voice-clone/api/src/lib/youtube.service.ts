import { Injectable, Logger, UnprocessableEntityException, InternalServerErrorException } from '@nestjs/common';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs';

const execFileAsync = promisify(execFile);

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  async extractAudio(youtubeUrl: string, startTime: string, endTime: string): Promise<string> {
    const startSeconds = this.timeToSeconds(startTime);
    const endSeconds = this.timeToSeconds(endTime);
    const duration = endSeconds - startSeconds;

    if (duration <= 0) {
      throw new UnprocessableEntityException('endTime must be greater than startTime');
    }

    if (duration < 10) {
      throw new UnprocessableEntityException('Audio segment must be at least 10 seconds (MiniMax requirement)');
    }

    if (duration > 300) {
      throw new UnprocessableEntityException('Audio segment must not exceed 5 minutes (MiniMax requirement)');
    }

    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const outputPath = path.join(tmpDir, `creo-voice-${Date.now()}.mp3`);

    try {
      const args = [
        '--no-playlist',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '192K',
        '--postprocessor-args', `ffmpeg:-ss ${startSeconds} -t ${duration}`,
        '-o', outputPath,
        youtubeUrl,
      ];

      this.logger.log(`Running yt-dlp for: ${youtubeUrl} [${startTime}-${endTime}]`);

      const { stderr } = await execFileAsync('yt-dlp', args, { timeout: 120_000 });

      if (stderr) {
        this.logger.warn(`yt-dlp stderr: ${stderr}`);
      }

      if (!fs.existsSync(outputPath)) {
        throw new Error('yt-dlp did not produce output file');
      }

      this.logger.log(`Audio extracted: ${outputPath} (${duration}s)`);
      return outputPath;
    } catch (error) {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

      if (error instanceof UnprocessableEntityException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`yt-dlp error: ${message}`);
      throw new InternalServerErrorException(`Failed to extract audio: ${message}`);
    }
  }

  cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Cleaned up temp file: ${filePath}`);
      }
    } catch {
      this.logger.warn(`Failed to cleanup temp file: ${filePath}`);
    }
  }

  private timeToSeconds(time: string): number {
    const [minutes, seconds] = time.split(':').map(Number);
    return minutes * 60 + seconds;
  }
}
