import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@creo/prisma';
import { StorageService } from '@creo/storage-api';
import { VideoAnalysisService } from '@creo/video-analysis-api';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { FfprobeService } from './ffprobe.service';
import { UploadInitDto } from './dto/upload-init.dto';

const ALLOWED_KINDS = ['video', 'audio', 'image'] as const;
type MediaKind = (typeof ALLOWED_KINDS)[number];

@Injectable()
export class MediaAssetsService {
  private readonly logger = new Logger(MediaAssetsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly ffprobe: FfprobeService,
    private readonly analysis: VideoAnalysisService,
  ) {}

  async initUpload(userId: string, dto: UploadInitDto) {
    const kind = this.kindFromContentType(dto.contentType);
    if (!kind) {
      throw new BadRequestException(`Unsupported content type: ${dto.contentType}`);
    }

    const assetId = randomUUID();
    const ext = this.safeExtension(dto.filename, dto.contentType);
    const storageKey = `media/${userId}/${assetId}${ext}`;

    const asset = await this.prisma.mediaAsset.create({
      data: {
        id: assetId,
        userId,
        kind,
        source: 'upload',
        originalName: dto.filename,
        storageKey,
        mimeType: dto.contentType,
        storageBytes: dto.size ?? null,
        status: 'uploading',
      },
    });

    const uploadUrl = await this.storage.getPresignedPutUrl(storageKey, dto.contentType);

    return {
      assetId: asset.id,
      uploadUrl,
      storageKey,
      expiresInSeconds: 900,
    };
  }

  async completeUpload(userId: string, id: string) {
    const asset = await this.findOne(userId, id);
    if (asset.status === 'ready') return this.toDto(asset);

    const head = await this.storage.headObject(asset.storageKey);
    if (!head) {
      await this.prisma.mediaAsset.update({
        where: { id },
        data: {
          status: 'failed',
          errorMessage: 'Upload not found in storage',
        },
      });
      throw new BadRequestException('Upload not found in storage');
    }

    let durationMs: number | null = null;
    let width: number | null = null;
    let height: number | null = null;

    if (asset.kind !== 'image') {
      const sourceUrl = await this.storage.getInternalPresignedUrl(asset.storageKey, 300);
      const probe = await this.ffprobe.probe(sourceUrl);
      durationMs = probe.durationMs;
      width = probe.width;
      height = probe.height;
    }

    const updated = await this.prisma.mediaAsset.update({
      where: { id },
      data: {
        status: 'ready',
        storageBytes: head.bytes,
        mimeType: head.contentType ?? asset.mimeType,
        durationMs,
        width,
        height,
        errorMessage: null,
      },
    });

    this.logger.log(
      `Asset ${id} ready: ${head.bytes} bytes, duration=${durationMs ?? '?'}ms`,
    );

    // Fire-and-forget: kick off scene/transcript/face analysis in the
    // background. Failures don't block the upload flow — the asset is
    // already usable, analysis is an enrichment.
    void this.analysis.enqueueSilently(id);

    return this.toDto(updated);
  }

  async findAll(userId: string) {
    const assets = await this.prisma.mediaAsset.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(assets.map((asset) => this.toDto(asset)));
  }

  async findOne(userId: string, id: string) {
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id, userId },
    });
    if (!asset) throw new NotFoundException('Media asset not found');
    return asset;
  }

  async findOneWithUrl(userId: string, id: string) {
    const asset = await this.findOne(userId, id);
    return this.toDto(asset);
  }

  async delete(userId: string, id: string) {
    const asset = await this.findOne(userId, id);
    await this.storage.delete(asset.storageKey).catch((err) => {
      this.logger.warn(`Failed to delete ${asset.storageKey}: ${err}`);
    });
    await this.prisma.mediaAsset.delete({ where: { id } });
    return { id };
  }

  private async toDto(asset: {
    id: string;
    userId: string;
    kind: string;
    source: string;
    sourceUrl: string | null;
    originalName: string | null;
    storageKey: string;
    storageBytes: number | null;
    durationMs: number | null;
    width: number | null;
    height: number | null;
    mimeType: string | null;
    thumbnailKey: string | null;
    status: string;
    errorMessage: string | null;
    analysisStatus: string;
    analysisError: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const url =
      asset.status === 'ready'
        ? await this.storage.getPresignedUrl(asset.storageKey)
        : null;

    return {
      id: asset.id,
      kind: asset.kind,
      source: asset.source,
      sourceUrl: asset.sourceUrl,
      originalName: asset.originalName,
      storageBytes: asset.storageBytes,
      durationMs: asset.durationMs,
      width: asset.width,
      height: asset.height,
      mimeType: asset.mimeType,
      status: asset.status,
      errorMessage: asset.errorMessage,
      analysisStatus: asset.analysisStatus,
      analysisError: asset.analysisError,
      url,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    };
  }

  private kindFromContentType(contentType: string): MediaKind | null {
    const base = contentType.split('/')[0];
    if (base === 'video') return 'video';
    if (base === 'audio') return 'audio';
    if (base === 'image') return 'image';
    return null;
  }

  private safeExtension(filename: string | undefined, contentType: string): string {
    if (filename) {
      const ext = extname(filename).toLowerCase();
      if (ext && /^\.[a-z0-9]{2,5}$/.test(ext)) return ext;
    }
    const map: Record<string, string> = {
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/quicktime': '.mov',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
    };
    return map[contentType] ?? '';
  }
}
