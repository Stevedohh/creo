import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Readable } from 'node:stream';

export interface UploadOptions {
  key: string;
  body: Readable | Buffer | string;
  contentType: string;
  contentLength?: number;
}

export interface UploadResult {
  key: string;
  bytes: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly presignClient: S3Client;
  private readonly bucket: string;
  private readonly presignedTtl: number;
  private readonly publicBaseUrl: string | undefined;

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.getOrThrow<string>('S3_ENDPOINT');
    const publicEndpoint =
      this.configService.get<string>('S3_PUBLIC_ENDPOINT') ?? endpoint;
    const region = this.configService.getOrThrow<string>('S3_REGION');
    const accessKeyId = this.configService.getOrThrow<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>('S3_SECRET_ACCESS_KEY');
    const forcePathStyle =
      this.configService.get<string>('S3_FORCE_PATH_STYLE') === 'true';

    this.bucket = this.configService.getOrThrow<string>('S3_BUCKET');
    this.presignedTtl = Number(
      this.configService.get<string>('S3_PRESIGNED_TTL') ?? '604800',
    );
    this.publicBaseUrl = this.configService.get<string>('S3_PUBLIC_BASE_URL');

    const credentials = { accessKeyId, secretAccessKey };

    this.client = new S3Client({
      endpoint,
      region,
      credentials,
      forcePathStyle,
    });

    this.presignClient =
      publicEndpoint === endpoint
        ? this.client
        : new S3Client({
            endpoint: publicEndpoint,
            region,
            credentials,
            forcePathStyle,
          });
  }

  async onModuleInit() {
    this.logger.log(
      `Storage configured: bucket=${this.bucket} presignedTtl=${this.presignedTtl}s`,
    );
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const uploader = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType,
        ContentLength: options.contentLength,
      },
      queueSize: 4,
      partSize: 5 * 1024 * 1024,
    });

    await uploader.done();

    const bytes = options.contentLength ?? (await this.headBytes(options.key));
    this.logger.log(`Uploaded ${options.key} (${bytes} bytes)`);
    return { key: options.key, bytes };
  }

  async getPresignedUrl(key: string, ttlSeconds?: number): Promise<string> {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.presignClient, command, {
      expiresIn: ttlSeconds ?? this.presignedTtl,
    });
  }

  /**
   * Presigned GET URL for server-side consumers running inside the Docker
   * network (e.g. ffprobe, ffmpeg workers). Always signed against the
   * internal endpoint so `minio:9000` resolves via Docker DNS — presigned
   * URLs from {@link getPresignedUrl} point at `localhost:9000` which a
   * container would resolve to itself.
   */
  async getInternalPresignedUrl(key: string, ttlSeconds?: number): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, {
      expiresIn: ttlSeconds ?? this.presignedTtl,
    });
  }

  /**
   * Presigned PUT URL for direct browser → S3/MinIO uploads. The browser
   * calls `fetch(url, { method: 'PUT', body: file })` against this URL,
   * bypassing the API server entirely. Faster and saves API bandwidth
   * compared to multipart/form-data round-tripping through Nest.
   *
   * TTL defaults to 15 minutes — long enough for a big upload but short
   * enough that a leaked URL is not a standing credential.
   */
  async getPresignedPutUrl(
    key: string,
    contentType: string,
    ttlSeconds = 900,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.presignClient, command, { expiresIn: ttlSeconds });
  }

  async headObject(key: string): Promise<{ bytes: number; contentType?: string } | null> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return {
        bytes: response.ContentLength ?? 0,
        contentType: response.ContentType,
      };
    } catch {
      return null;
    }
  }

  getPresignedTtlSeconds(): number {
    return this.presignedTtl;
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    this.logger.log(`Deleted ${key}`);
  }

  async deleteMany(keys: Array<string | null | undefined>): Promise<void> {
    const unique = Array.from(
      new Set(keys.filter((key): key is string => Boolean(key))),
    );
    await Promise.all(unique.map((key) => this.delete(key)));
  }

  private async headBytes(key: string): Promise<number> {
    try {
      const response = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return response.ContentLength ?? 0;
    } catch {
      return 0;
    }
  }
}
