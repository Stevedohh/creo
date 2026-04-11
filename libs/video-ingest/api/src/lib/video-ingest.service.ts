import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '@creo/prisma';
import {
  YOUTUBE_INGEST_QUEUE,
  type YoutubeIngestJobData,
} from './youtube-ingest.constants';
import { IngestYoutubeDto } from './dto/ingest-youtube.dto';

const YT_URL_RE =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|v\/)|youtu\.be\/)[A-Za-z0-9_-]{6,}/i;

@Injectable()
export class VideoIngestService {
  private readonly logger = new Logger(VideoIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(YOUTUBE_INGEST_QUEUE)
    private readonly queue: Queue<YoutubeIngestJobData>,
  ) {}

  async ingestYoutube(userId: string, dto: IngestYoutubeDto) {
    if (!YT_URL_RE.test(dto.url)) {
      throw new BadRequestException('URL is not a recognizable YouTube link');
    }

    const job = await this.prisma.ingestJob.create({
      data: {
        userId,
        kind: 'youtube',
        sourceUrl: dto.url,
        status: 'queued',
      },
    });

    await this.queue.add(
      'ingest',
      { ingestJobId: job.id },
      { jobId: job.id },
    );

    this.logger.log(`Queued YouTube ingest job=${job.id} url=${dto.url}`);
    return this.toDto(job);
  }

  async findJob(userId: string, id: string) {
    const job = await this.prisma.ingestJob.findFirst({
      where: { id, userId },
    });
    if (!job) throw new NotFoundException('Ingest job not found');
    return this.toDto(job);
  }

  async listJobs(userId: string) {
    const jobs = await this.prisma.ingestJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return jobs.map((job) => this.toDto(job));
  }

  private toDto(job: {
    id: string;
    userId: string;
    kind: string;
    sourceUrl: string;
    title: string | null;
    status: string;
    progress: number;
    assetId: string | null;
    errorMessage: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: job.id,
      kind: job.kind,
      sourceUrl: job.sourceUrl,
      title: job.title,
      status: job.status,
      progress: job.progress,
      assetId: job.assetId,
      errorMessage: job.errorMessage,
      startedAt: job.startedAt?.toISOString() ?? null,
      finishedAt: job.finishedAt?.toISOString() ?? null,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }
}
