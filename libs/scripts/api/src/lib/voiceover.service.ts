import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { PrismaService } from '@creo/prisma';
import { StorageService } from '@creo/storage-api';
import { MinimaxService } from '@creo/voice-clone-api';
import {
  VOICEOVER_INGEST_QUEUE,
  type VoiceoverIngestJobData,
} from './voiceover-ingest.constants';

@Injectable()
export class VoiceoverService implements OnModuleInit {
  private readonly logger = new Logger(VoiceoverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minimax: MinimaxService,
    private readonly storage: StorageService,
    @InjectQueue(VOICEOVER_INGEST_QUEUE)
    private readonly ingestQueue: Queue<VoiceoverIngestJobData>,
  ) {}

  async onModuleInit() {
    const stuck = await this.prisma.voiceover.findMany({
      where: { status: 'uploading', minimaxFileId: { not: null } },
      select: { id: true, minimaxFileId: true },
    });

    if (stuck.length === 0) return;

    this.logger.log(
      `Re-enqueueing ${stuck.length} voiceover ingest jobs stuck in 'uploading'`,
    );

    for (const vo of stuck) {
      await this.enqueueIngest(vo.id, vo.minimaxFileId as string);
    }
  }

  private async enqueueIngest(
    voiceoverId: string,
    minimaxFileId: string,
  ): Promise<void> {
    await this.ingestQueue.add(
      'ingest',
      { voiceoverId, minimaxFileId },
      { jobId: `ingest-${voiceoverId}` },
    );
  }

  async create(scriptId: string, voiceId: string, userId: string) {
    const script = await this.prisma.script.findFirst({
      where: { id: scriptId, userId },
    });

    if (!script) {
      throw new NotFoundException('Script not found');
    }

    const plaintext = this.extractTextFromTiptap(script.content);

    const voice = await this.prisma.voice.findFirst({
      where: { id: voiceId, userId },
    });

    if (!voice) {
      throw new NotFoundException('Voice not found');
    }

    const voiceover = await this.prisma.voiceover.create({
      data: {
        scriptId,
        voiceId,
        status: 'pending',
        characterCount: plaintext.length,
      },
    });

    try {
      const { taskId } = await this.minimax.createTtsTask(
        plaintext,
        voice.minimaxVoiceId,
      );

      const taskIdStr = String(taskId);

      const updated = await this.prisma.voiceover.update({
        where: { id: voiceover.id },
        data: { minimaxTaskId: taskIdStr, status: 'processing' },
        include: { voice: { select: { id: true, name: true } } },
      });

      this.pollTask(voiceover.id, taskIdStr);

      return updated;
    } catch (error) {
      await this.prisma.voiceover.update({
        where: { id: voiceover.id },
        data: { status: 'failed' },
      });
      throw error;
    }
  }

  private extractTextFromTiptap(content: string): string {
    try {
      const doc = JSON.parse(content);
      return this.walkNodes(doc.content || []);
    } catch {
      return content;
    }
  }

  private walkNodes(nodes: unknown[]): string {
    return (nodes as Record<string, unknown>[])
      .map((node) => {
        if (node.type === 'text') return (node.text as string) || '';
        if (Array.isArray(node.content)) return this.walkNodes(node.content);
        return '\n';
      })
      .join('');
  }

  private static readonly POLL_INTERVAL_MS = 3000;
  private static readonly POLL_MAX_ATTEMPTS = 240;
  private static readonly POLL_LOG_EVERY = 10;

  private pollTask(voiceoverId: string, taskId: string, attempt = 0) {
    setTimeout(async () => {
      try {
        if (attempt >= VoiceoverService.POLL_MAX_ATTEMPTS) {
          await this.prisma.voiceover.update({
            where: { id: voiceoverId },
            data: { status: 'failed' },
          });
          this.logger.warn(
            `TTS polling timed out for voiceover ${voiceoverId}`,
          );
          return;
        }

        const result = await this.minimax.queryTtsTask(taskId);

        if (
          attempt === 0 ||
          (attempt + 1) % VoiceoverService.POLL_LOG_EVERY === 0
        ) {
          const elapsed = Math.round(
            ((attempt + 1) * VoiceoverService.POLL_INTERVAL_MS) / 1000,
          );
          this.logger.log(
            `Polling voiceover ${voiceoverId}: attempt ${attempt + 1}/${
              VoiceoverService.POLL_MAX_ATTEMPTS
            } status=${result.status} elapsed=${elapsed}s`,
          );
        }

        if (result.status === 'Success' && result.fileId) {
          await this.prisma.voiceover.update({
            where: { id: voiceoverId },
            data: {
              status: 'uploading',
              minimaxFileId: result.fileId,
            },
          });
          try {
            await this.enqueueIngest(voiceoverId, result.fileId);
            this.logger.log(
              `TTS success for voiceover ${voiceoverId}; ingest job enqueued`,
            );
          } catch (enqueueError) {
            await this.prisma.voiceover.update({
              where: { id: voiceoverId },
              data: { status: 'failed' },
            });
            this.logger.error(
              `Failed to enqueue ingest for voiceover ${voiceoverId}: ${enqueueError}`,
            );
          }
          return;
        } else if (
          result.status === 'Failed' ||
          result.status === 'Expired'
        ) {
          await this.prisma.voiceover.update({
            where: { id: voiceoverId },
            data: { status: 'failed' },
          });
          this.logger.warn(
            `TTS ${result.status.toLowerCase()} for voiceover ${voiceoverId}`,
          );
        } else {
          this.pollTask(voiceoverId, taskId, attempt + 1);
        }
      } catch (error) {
        this.logger.error(
          `TTS poll error for voiceover ${voiceoverId}: ${error}`,
        );
        if (attempt < VoiceoverService.POLL_MAX_ATTEMPTS) {
          this.pollTask(voiceoverId, taskId, attempt + 1);
        }
      }
    }, VoiceoverService.POLL_INTERVAL_MS);
  }

  async findByScript(scriptId: string, userId: string) {
    const script = await this.prisma.script.findFirst({
      where: { id: scriptId, userId },
    });

    if (!script) {
      throw new NotFoundException('Script not found');
    }

    const voiceovers = await this.prisma.voiceover.findMany({
      where: { scriptId },
      include: { voice: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      voiceovers.map(async (vo) =>
        vo.status === 'completed' && vo.storageKey
          ? { ...vo, audioUrl: await this.storage.getPresignedUrl(vo.storageKey) }
          : vo,
      ),
    );
  }

  async getAudioUrl(id: string, userId: string): Promise<string> {
    const voiceover = await this.prisma.voiceover.findFirst({
      where: { id },
      include: { script: { select: { userId: true } } },
    });

    if (!voiceover || voiceover.script.userId !== userId) {
      throw new NotFoundException('Voiceover not found');
    }

    if (voiceover.status !== 'completed' || !voiceover.storageKey) {
      throw new BadRequestException('Audio not ready');
    }

    return this.storage.getPresignedUrl(voiceover.storageKey);
  }

  async delete(id: string, userId: string) {
    const voiceover = await this.prisma.voiceover.findFirst({
      where: { id },
      include: { script: { select: { userId: true } } },
    });

    if (!voiceover || voiceover.script.userId !== userId) {
      throw new NotFoundException('Voiceover not found');
    }

    await this.storage.deleteMany([
      voiceover.storageKey,
      voiceover.subtitlesKey,
    ]);

    await this.prisma.voiceover.delete({ where: { id } });

    return { id };
  }
}
