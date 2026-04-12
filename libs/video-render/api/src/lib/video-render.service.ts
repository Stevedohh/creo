import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { Prisma, PrismaService } from '@creo/prisma';
import { StorageService } from '@creo/storage-api';
import {
  RENDER_QUEUE,
  type RenderJobData,
} from './video-render.constants';
import type { RenderJobDto } from './dto/render-job.dto';
import {
  DEFAULT_EXPORT_SETTINGS,
  type RenderExportSettings,
  type RenderSnapshotPayload,
} from './render-settings';

type RenderJobRow = {
  id: string;
  projectId: string | null;
  userId: string;
  status: string;
  progress: number;
  resultKey: string | null;
  resultBytes: number | null;
  errorMessage: string | null;
  bullJobId: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class VideoRenderService {
  private readonly logger = new Logger(VideoRenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue(RENDER_QUEUE)
    private readonly queue: Queue<RenderJobData>,
  ) {}

  async startRender(userId: string, projectId: string): Promise<RenderJobDto> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const timeline = project.timeline;
    if (!timeline || typeof timeline !== 'object') {
      throw new BadRequestException('Project timeline is empty');
    }

    // Snapshot the timeline at enqueue time so live edits don't mutate
    // an in-flight render. Wrap in RenderSnapshotPayload so the worker
    // can read document + exportSettings from a single JSON blob.
    const snapshot: RenderSnapshotPayload = {
      document: timeline as unknown,
      exportSettings: DEFAULT_EXPORT_SETTINGS,
    };
    const row = await this.prisma.renderJob.create({
      data: {
        userId,
        projectId,
        status: 'queued',
        progress: 0,
        timelineSnapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
    });

    // Stale-job dedup: same pattern as video-analysis.service.
    const existing = await this.queue.getJob(row.id);
    if (existing) await existing.remove().catch(() => undefined);

    await this.queue.add(
      'render',
      { renderJobId: row.id },
      {
        jobId: row.id,
        // Long-running: override defaultJobOptions on a per-job basis so
        // 1h+ renders don't get stuck against short lockDuration.
      },
    );

    await this.prisma.renderJob.update({
      where: { id: row.id },
      data: { bullJobId: row.id },
    });

    this.logger.log(`Queued render job=${row.id} project=${projectId}`);
    return this.toDto(row);
  }

  async startDocumentRender(
    userId: string,
    document: Record<string, unknown>,
    exportSettings?: Partial<RenderExportSettings>,
  ): Promise<RenderJobDto> {
    if (!document || typeof document !== 'object') {
      throw new BadRequestException('Document payload is required');
    }

    const merged: RenderExportSettings = {
      ...DEFAULT_EXPORT_SETTINGS,
      ...(exportSettings ?? {}),
    };
    const snapshot: RenderSnapshotPayload = { document, exportSettings: merged };

    // Ad-hoc renders don't belong to a stored project. `projectId` is
    // nullable in the schema for exactly this case.
    const row = await this.prisma.renderJob.create({
      data: {
        userId,
        projectId: null,
        status: 'queued',
        progress: 0,
        timelineSnapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
    });

    const existing = await this.queue.getJob(row.id);
    if (existing) await existing.remove().catch(() => undefined);

    await this.queue.add('render', { renderJobId: row.id }, { jobId: row.id });

    await this.prisma.renderJob.update({
      where: { id: row.id },
      data: { bullJobId: row.id },
    });

    this.logger.log(`Queued ad-hoc render job=${row.id}`);
    return this.toDto(row);
  }

  async findJob(userId: string, id: string): Promise<RenderJobDto> {
    const row = await this.prisma.renderJob.findFirst({
      where: { id, userId },
    });
    if (!row) throw new NotFoundException('Render job not found');
    return this.toDto(row);
  }

  async cancel(userId: string, id: string): Promise<RenderJobDto> {
    const row = await this.prisma.renderJob.findFirst({
      where: { id, userId },
    });
    if (!row) throw new NotFoundException('Render job not found');
    if (row.status === 'succeeded' || row.status === 'failed' || row.status === 'canceled') {
      return this.toDto(row);
    }

    // Remove from queue (works both for waiting and active via BullMQ's
    // cooperative signal). The processor's finally block will mark the
    // row as canceled when it sees the job disappeared.
    const job = await this.queue.getJob(id);
    if (job) await job.remove().catch(() => undefined);

    const updated = await this.prisma.renderJob.update({
      where: { id },
      data: {
        status: 'canceled',
        finishedAt: new Date(),
      },
    });
    return this.toDto(updated);
  }

  private async toDto(row: RenderJobRow): Promise<RenderJobDto> {
    let downloadUrl: string | null = null;
    if (row.status === 'succeeded' && row.resultKey) {
      downloadUrl = await this.storage.getPresignedUrl(row.resultKey);
    }
    return {
      id: row.id,
      projectId: row.projectId,
      status: row.status as RenderJobDto['status'],
      progress: row.progress,
      resultBytes: row.resultBytes,
      downloadUrl,
      errorMessage: row.errorMessage,
      startedAt: row.startedAt?.toISOString() ?? null,
      finishedAt: row.finishedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
