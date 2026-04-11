import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '@creo/prisma';
import { StorageService } from '@creo/storage-api';
import {
  VIDEO_ANALYSIS_QUEUE,
  type VideoAnalysisJobData,
} from './video-analysis.constants';

@Injectable()
export class VideoAnalysisService {
  private readonly logger = new Logger(VideoAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    @InjectQueue(VIDEO_ANALYSIS_QUEUE)
    private readonly queue: Queue<VideoAnalysisJobData>,
  ) {}

  /**
   * Enqueue analysis for an asset the user owns. Idempotent: if the asset
   * is already queued or running we just return its current status. Used
   * by both the explicit POST /analyze/:id controller and by the auto-
   * trigger after MediaAssetsService/YoutubeIngestProcessor finishes.
   */
  async enqueue(userId: string, assetId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, userId },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    if (asset.kind !== 'video') {
      return { id: asset.id, analysisStatus: asset.analysisStatus };
    }
    if (
      asset.analysisStatus === 'queued' ||
      asset.analysisStatus === 'running'
    ) {
      return { id: asset.id, analysisStatus: asset.analysisStatus };
    }

    await this.prisma.mediaAsset.update({
      where: { id: assetId },
      data: { analysisStatus: 'queued', analysisError: null },
    });

    // Remove any stale job with the same deterministic id (e.g. a failed
    // previous attempt we want to re-run). BullMQ dedupes by jobId, so
    // without this the new add() is a no-op for a failed/completed job.
    const existing = await this.queue.getJob(`analyze-${assetId}`);
    if (existing) await existing.remove().catch(() => undefined);

    await this.queue.add(
      'analyze',
      { assetId },
      { jobId: `analyze-${assetId}` },
    );

    this.logger.log(`Queued analysis for asset=${assetId}`);
    return { id: asset.id, analysisStatus: 'queued' };
  }

  /**
   * Fire-and-forget version used by upstream processors that own their own
   * flow (e.g. YoutubeIngestProcessor after the upload completes). Errors
   * are logged but never thrown back at the caller.
   */
  async enqueueSilently(assetId: string): Promise<void> {
    try {
      const asset = await this.prisma.mediaAsset.findUnique({
        where: { id: assetId },
        select: { userId: true, kind: true, analysisStatus: true },
      });
      if (!asset || asset.kind !== 'video') return;
      if (
        asset.analysisStatus === 'queued' ||
        asset.analysisStatus === 'running'
      )
        return;

      await this.prisma.mediaAsset.update({
        where: { id: assetId },
        data: { analysisStatus: 'queued', analysisError: null },
      });
      const existing = await this.queue.getJob(`analyze-${assetId}`);
      if (existing) await existing.remove().catch(() => undefined);
      await this.queue.add(
        'analyze',
        { assetId },
        { jobId: `analyze-${assetId}` },
      );
      this.logger.log(`Auto-queued analysis for asset=${assetId}`);
    } catch (err) {
      this.logger.warn(
        `enqueueSilently failed for ${assetId}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async getAnalysis(userId: string, assetId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, userId },
      select: { id: true, analysisStatus: true, analysisError: true },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    const [shots, transcript, faces] = await Promise.all([
      this.prisma.shot.findMany({
        where: { assetId },
        orderBy: { index: 'asc' },
      }),
      this.prisma.transcriptSegment.findMany({
        where: { assetId },
        orderBy: { index: 'asc' },
      }),
      this.prisma.faceDetection.findMany({
        where: { assetId },
        orderBy: { startMs: 'asc' },
      }),
    ]);

    const shotsWithUrls = await Promise.all(
      shots.map(async (s) => ({
        id: s.id,
        index: s.index,
        startMs: s.startMs,
        endMs: s.endMs,
        thumbnailKey: s.thumbnailKey,
        thumbnailUrl: s.thumbnailKey
          ? await this.storage.getPresignedUrl(s.thumbnailKey)
          : null,
      })),
    );

    return {
      assetId: asset.id,
      status: asset.analysisStatus,
      error: asset.analysisError,
      shots: shotsWithUrls,
      transcript: transcript.map((t) => ({
        id: t.id,
        index: t.index,
        startMs: t.startMs,
        endMs: t.endMs,
        text: t.text,
      })),
      faces: faces.map((f) => ({
        id: f.id,
        startMs: f.startMs,
        endMs: f.endMs,
        faceCount: f.faceCount,
        bbox: { x: f.bboxX, y: f.bboxY, w: f.bboxW, h: f.bboxH },
      })),
    };
  }
}
