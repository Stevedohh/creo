import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '@creo/prisma';
import { StorageService } from '@creo/storage-api';
import { VideoAnalysisService } from '@creo/video-analysis-api';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  YOUTUBE_INGEST_QUEUE,
  type YoutubeIngestJobData,
} from './youtube-ingest.constants';

interface YtDlpMetadata {
  id: string;
  title: string;
  duration?: number;
  width?: number;
  height?: number;
  ext: string;
}

/**
 * Downloads a YouTube video to a temp dir via yt-dlp, uploads the mp4 to
 * MinIO, runs ffprobe (cheap: we already have exact metadata from yt-dlp's
 * --print-json), creates a ready MediaAsset, and flips the IngestJob to
 * done. On any failure we mark the job as failed with the error message
 * and let BullMQ retry per the queue config (2 attempts, 10s backoff).
 *
 * yt-dlp is already installed in the api container via docker-compose
 * entrypoint: `pip3 install yt-dlp`.
 */
@Processor(YOUTUBE_INGEST_QUEUE, { concurrency: 2 })
export class YoutubeIngestProcessor extends WorkerHost {
  private readonly logger = new Logger(YoutubeIngestProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly analysis: VideoAnalysisService,
  ) {
    super();
  }

  async process(job: Job<YoutubeIngestJobData>): Promise<void> {
    const { ingestJobId } = job.data;
    this.logger.log(`YT ingest start job=${ingestJobId}`);

    const ingest = await this.prisma.ingestJob.findUnique({
      where: { id: ingestJobId },
    });
    if (!ingest) {
      this.logger.warn(`Ingest job ${ingestJobId} disappeared`);
      return;
    }
    if (ingest.status === 'done') {
      this.logger.log(`Ingest job ${ingestJobId} already done`);
      return;
    }

    await this.prisma.ingestJob.update({
      where: { id: ingestJobId },
      data: {
        status: 'running',
        progress: 5,
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    const workDir = await mkdtemp(join(tmpdir(), 'yt-'));
    try {
      // Step 1: get metadata only (quick, catches unavailable/blocked videos
      // before we burn bandwidth).
      await this.updateProgress(ingestJobId, 10);
      const meta = await this.dumpMetadata(ingest.sourceUrl);

      await this.prisma.ingestJob.update({
        where: { id: ingestJobId },
        data: { title: meta.title },
      });

      // Step 2: download best mp4 to the temp dir.
      await this.updateProgress(ingestJobId, 20);
      const outputTemplate = join(workDir, '%(id)s.%(ext)s');
      await this.download(ingest.sourceUrl, outputTemplate);

      // yt-dlp is unpredictable about final extension even when we ask for
      // mp4 — look for whatever file landed in the temp dir.
      const downloadedPath = join(workDir, `${meta.id}.mp4`);
      const fileStat = await stat(downloadedPath).catch(() => null);
      if (!fileStat) {
        throw new Error(`yt-dlp did not produce ${downloadedPath}`);
      }

      await this.updateProgress(ingestJobId, 70);

      // Step 3: create a MediaAsset row first (status=uploading), then
      // stream the tmp file to S3 via StorageService.upload (which is
      // designed for server-side multipart uploads).
      const assetId = crypto.randomUUID();
      const storageKey = `media/${ingest.userId}/${assetId}.mp4`;

      await this.prisma.mediaAsset.create({
        data: {
          id: assetId,
          userId: ingest.userId,
          kind: 'video',
          source: 'youtube',
          sourceUrl: ingest.sourceUrl,
          originalName: `${meta.title}.mp4`,
          storageKey,
          storageBytes: fileStat.size,
          durationMs: meta.duration ? Math.round(meta.duration * 1000) : null,
          width: meta.width ?? null,
          height: meta.height ?? null,
          mimeType: 'video/mp4',
          status: 'uploading',
        },
      });

      await this.storage.upload({
        key: storageKey,
        body: createReadStream(downloadedPath),
        contentType: 'video/mp4',
        contentLength: fileStat.size,
      });

      await this.prisma.mediaAsset.update({
        where: { id: assetId },
        data: { status: 'ready' },
      });

      // Fire-and-forget scene/transcript/face analysis for this new asset.
      void this.analysis.enqueueSilently(assetId);

      await this.prisma.ingestJob.update({
        where: { id: ingestJobId },
        data: {
          status: 'done',
          progress: 100,
          assetId,
          finishedAt: new Date(),
        },
      });

      this.logger.log(
        `YT ingest done job=${ingestJobId} asset=${assetId} size=${fileStat.size}B`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`YT ingest failed job=${ingestJobId}: ${message}`);
      await this.prisma.ingestJob.update({
        where: { id: ingestJobId },
        data: {
          status: 'failed',
          errorMessage: message.slice(0, 1000),
          finishedAt: new Date(),
        },
      });
      throw err;
    } finally {
      await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private async updateProgress(id: string, progress: number) {
    await this.prisma.ingestJob.update({
      where: { id },
      data: { progress },
    });
  }

  private dumpMetadata(url: string): Promise<YtDlpMetadata> {
    return new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', [
        '--dump-json',
        '--no-warnings',
        '--no-playlist',
        '-f',
        'best[ext=mp4]/best',
        url,
      ]);
      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
      proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp metadata exited ${code}: ${stderr.trim().slice(0, 500)}`));
          return;
        }
        try {
          const parsed = JSON.parse(stdout) as YtDlpMetadata;
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse yt-dlp metadata: ${(err as Error).message}`));
        }
      });
    });
  }

  private download(url: string, outputTemplate: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn('yt-dlp', [
        '--no-warnings',
        '--no-playlist',
        '-f',
        'best[ext=mp4][height<=1080]/best[ext=mp4]/best',
        '--merge-output-format',
        'mp4',
        '-o',
        outputTemplate,
        url,
      ]);
      let stderr = '';
      proc.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`yt-dlp download exited ${code}: ${stderr.trim().slice(0, 500)}`));
          return;
        }
        resolve();
      });
    });
  }
}
