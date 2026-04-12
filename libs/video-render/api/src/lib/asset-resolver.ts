import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@creo/prisma';
import { StorageService } from '@creo/storage-api';

interface ClipLike {
  type?: string;
  assetId?: string;
  storageKey?: string;
  src?: string;
}

interface TrackLike {
  clips?: ClipLike[];
}

interface DocumentLike {
  tracks?: TrackLike[];
}

/**
 * Rewrite every clip's `src` to a URL that the worker's headless
 * Chromium can actually fetch. Clients hand us presigned S3 URLs
 * against the *public* S3 endpoint (e.g. `localhost:9000`) which
 * aren't reachable from inside the Docker network — the worker must
 * use the *internal* endpoint (`minio:9000`).
 *
 * Primary path: look up the MediaAsset by `assetId` in Prisma and
 * generate a fresh internal presigned URL from its `storageKey`.
 *
 * Fallback: if the src points at the public endpoint, rewrite the
 * hostname in-place. This covers clips that predate the media-library
 * integration or assets attached by other means.
 */
@Injectable()
export class AssetResolver {
  private readonly logger = new Logger(AssetResolver.name);
  private readonly publicHost: URL | null;
  private readonly internalHost: URL | null;

  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const pub = this.config.get<string>('S3_PUBLIC_ENDPOINT');
    const internal = this.config.get<string>('S3_ENDPOINT');
    this.publicHost = pub ? this.safeUrl(pub) : null;
    this.internalHost = internal ? this.safeUrl(internal) : null;
  }

  async resolve<T>(document: T): Promise<T> {
    const doc = document as unknown as DocumentLike;
    if (!doc?.tracks?.length) return document;

    const assetIds = new Set<string>();
    for (const track of doc.tracks) {
      for (const clip of track.clips ?? []) {
        if (clip.type === 'text') continue;
        if (clip.assetId) assetIds.add(clip.assetId);
      }
    }

    const assets = assetIds.size
      ? await this.prisma.mediaAsset.findMany({
          where: { id: { in: Array.from(assetIds) } },
          select: { id: true, storageKey: true },
        })
      : [];
    const byId = new Map(assets.map((a) => [a.id, a] as const));

    for (const track of doc.tracks) {
      if (!track.clips?.length) continue;
      for (const clip of track.clips) {
        if (clip.type === 'text') continue;

        if (clip.assetId) {
          const asset = byId.get(clip.assetId);
          if (asset?.storageKey) {
            clip.src = await this.storage.getInternalPresignedUrl(
              asset.storageKey,
            );
            continue;
          }
          this.logger.warn(
            `Clip assetId=${clip.assetId} not found in DB — falling back to src rewrite`,
          );
        }

        if (clip.storageKey) {
          clip.src = await this.storage.getInternalPresignedUrl(clip.storageKey);
          continue;
        }

        if (clip.src) {
          const rewritten = this.rewriteHostname(clip.src);
          if (rewritten !== clip.src) {
            this.logger.debug(
              `Rewrote clip src host: ${clip.src.split('?')[0]} → ${rewritten.split('?')[0]}`,
            );
            clip.src = rewritten;
          }
        }
      }
    }
    return document;
  }

  private rewriteHostname(url: string): string {
    if (!this.publicHost || !this.internalHost) return url;
    try {
      const u = new URL(url);
      if (u.host === this.publicHost.host) {
        u.protocol = this.internalHost.protocol;
        u.host = this.internalHost.host;
        return u.toString();
      }
    } catch {
      // not a valid URL — leave as-is
    }
    return url;
  }

  private safeUrl(value: string): URL | null {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }
}
