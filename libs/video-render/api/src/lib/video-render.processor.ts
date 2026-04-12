import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import * as fs from 'node:fs/promises';
import { PrismaService } from '@creo/prisma';
import { StorageService } from '@creo/storage-api';
import { RENDER_QUEUE, type RenderJobData } from './video-render.constants';
import { RemotionRenderer } from './remotion-renderer';
import { AssetResolver } from './asset-resolver';
import {
  DEFAULT_EXPORT_SETTINGS,
  type RenderExportSettings,
  type RenderSnapshotPayload,
} from './render-settings';

@Processor(RENDER_QUEUE)
export class VideoRenderProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoRenderProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly renderer: RemotionRenderer,
    private readonly assets: AssetResolver,
  ) {
    super();
  }

  async process(job: Job<RenderJobData>): Promise<void> {
    const { renderJobId } = job.data;
    this.logger.log(`Render job ${renderJobId} picked up`);

    const row = await this.prisma.renderJob.update({
      where: { id: renderJobId },
      data: { status: 'running', startedAt: new Date() },
    });

    const snapshot = row.timelineSnapshot as unknown as RenderSnapshotPayload;
    const exportSettings: RenderExportSettings = {
      ...DEFAULT_EXPORT_SETTINGS,
      ...(snapshot?.exportSettings ?? {}),
    };

    let outputPath: string | null = null;
    try {
      const resolvedDoc = await this.assets.resolve(snapshot?.document ?? snapshot);

      const rendered = await this.renderer.render({
        inputProps: { doc: resolvedDoc as never },
        exportSettings,
        onProgress: async (percent) => {
          await job.updateProgress(percent);
          // Persist progress so clients polling REST see it without
          // hitting BullMQ directly.
          await this.prisma.renderJob
            .update({
              where: { id: renderJobId },
              data: { progress: percent },
            })
            .catch((err: Error) =>
              this.logger.warn(`Progress update failed: ${err.message}`),
            );
        },
      });
      outputPath = rendered.outputPath;

      const key = `renders/${renderJobId}.${rendered.outputPath.split('.').pop()}`;
      const stream = (await import('node:fs')).createReadStream(outputPath);
      const upload = await this.storage.upload({
        key,
        body: stream,
        contentType: rendered.contentType,
        contentLength: rendered.bytes,
      });

      await this.prisma.renderJob.update({
        where: { id: renderJobId },
        data: {
          status: 'succeeded',
          progress: 100,
          resultKey: upload.key,
          resultBytes: upload.bytes,
          finishedAt: new Date(),
        },
      });
      this.logger.log(`Render job ${renderJobId} succeeded → ${upload.key} (${upload.bytes} bytes)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Render job ${renderJobId} failed: ${message}`);
      await this.prisma.renderJob.update({
        where: { id: renderJobId },
        data: {
          status: 'failed',
          errorMessage: message,
          finishedAt: new Date(),
        },
      });
      throw err;
    } finally {
      if (outputPath) {
        await fs.rm(outputPath, { force: true }).catch(() => undefined);
      }
    }
  }
}
