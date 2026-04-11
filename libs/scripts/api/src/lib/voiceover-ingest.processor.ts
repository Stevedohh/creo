import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import axios from 'axios';
import { PassThrough, Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as tar from 'tar';
import { PrismaService } from '@creo/prisma';
import { StorageService } from '@creo/storage-api';
import { MinimaxService } from '@creo/voice-clone-api';
import {
  VOICEOVER_INGEST_QUEUE,
  type VoiceoverIngestJobData,
} from './voiceover-ingest.constants';

interface ExtractedEntry {
  key: string;
  bytes: number;
  contentType: string;
}

@Processor(VOICEOVER_INGEST_QUEUE, { concurrency: 4 })
export class VoiceoverIngestProcessor extends WorkerHost {
  private readonly logger = new Logger(VoiceoverIngestProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly minimax: MinimaxService,
  ) {
    super();
  }

  async process(job: Job<VoiceoverIngestJobData>): Promise<void> {
    const { voiceoverId, minimaxFileId } = job.data;
    this.logger.log(
      `Ingest start voiceover=${voiceoverId} file=${minimaxFileId}`,
    );

    const voiceover = await this.prisma.voiceover.findUnique({
      where: { id: voiceoverId },
      select: { id: true, storageKey: true, script: { select: { userId: true } } },
    });

    if (!voiceover) {
      this.logger.warn(`Voiceover ${voiceoverId} disappeared; skipping`);
      return;
    }

    if (voiceover.storageKey) {
      this.logger.log(`Voiceover ${voiceoverId} already ingested; skipping`);
      return;
    }

    const downloadUrl = await this.minimax.getFileUrl(minimaxFileId);
    const response = await axios.get<Readable>(downloadUrl, {
      responseType: 'stream',
      timeout: 120_000,
    });

    const userId = voiceover.script.userId;
    const audioKey = `voiceovers/${userId}/${voiceoverId}.mp3`;
    const subtitlesKey = `voiceovers/${userId}/${voiceoverId}.subtitles.json`;

    const audioResult = await this.extractAndUpload(response.data, {
      audioKey,
      subtitlesKey,
    });

    if (!audioResult.audio) {
      throw new Error(
        `No audio entry found inside tar for voiceover ${voiceoverId}`,
      );
    }

    const presignedUrl = await this.storage.getPresignedUrl(audioResult.audio.key);
    const ttl = this.storage.getPresignedTtlSeconds();

    await this.prisma.voiceover.update({
      where: { id: voiceoverId },
      data: {
        status: 'completed',
        storageKey: audioResult.audio.key,
        storageBytes: audioResult.audio.bytes,
        storageUploadedAt: new Date(),
        subtitlesKey: audioResult.subtitles?.key ?? null,
        audioUrl: presignedUrl,
        audioExpiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    this.logger.log(
      `Ingest done voiceover=${voiceoverId} audio=${audioResult.audio.bytes}B subtitles=${
        audioResult.subtitles?.bytes ?? 0
      }B`,
    );
  }

  private async extractAndUpload(
    tarStream: Readable,
    keys: { audioKey: string; subtitlesKey: string },
  ): Promise<{ audio?: ExtractedEntry; subtitles?: ExtractedEntry }> {
    const uploads: Array<Promise<void>> = [];
    let audio: ExtractedEntry | undefined;
    let subtitles: ExtractedEntry | undefined;

    const parser = new tar.Parser();

    parser.on('entry', (entry) => {
      const name = entry.path.toLowerCase();
      const isAudio = name.endsWith('.mp3') || name.endsWith('.wav');
      const isSubtitles = name.endsWith('.json');

      if (!isAudio && !isSubtitles) {
        entry.resume();
        return;
      }

      const passthrough = new PassThrough();
      entry.pipe(passthrough);

      if (isAudio && !audio) {
        const key = keys.audioKey;
        const contentType = name.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
        uploads.push(
          this.storage
            .upload({ key, body: passthrough, contentType })
            .then((result) => {
              audio = { key, bytes: result.bytes, contentType };
            }),
        );
      } else if (isSubtitles && !subtitles) {
        const key = keys.subtitlesKey;
        uploads.push(
          this.storage
            .upload({ key, body: passthrough, contentType: 'application/json' })
            .then((result) => {
              subtitles = { key, bytes: result.bytes, contentType: 'application/json' };
            }),
        );
      } else {
        entry.resume();
      }
    });

    await pipeline(tarStream, parser);
    await Promise.all(uploads);

    return { audio, subtitles };
  }
}
