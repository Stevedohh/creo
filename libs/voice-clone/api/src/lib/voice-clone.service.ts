import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@creo/prisma';
import { YoutubeService } from './youtube.service';
import { MinimaxService } from './minimax.service';
import { CloneVoiceDto } from './dto/clone-voice.dto';

export interface CloneVoiceResult {
  id: string;
  voiceId: string;
  voiceName: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class VoiceCloneService {
  private readonly logger = new Logger(VoiceCloneService.name);

  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly minimaxService: MinimaxService,
    private readonly prisma: PrismaService,
  ) {}

  async cloneVoice(userId: string, dto: CloneVoiceDto): Promise<CloneVoiceResult> {
    const voiceId = MinimaxService.sanitizeVoiceId(dto.voiceName);
    let audioPath: string | null = null;

    try {
      this.logger.log(
        `Starting voice clone: "${dto.voiceName}" from ${dto.youtubeUrl} [${dto.startTime}-${dto.endTime}]`
      );

      audioPath = await this.youtubeService.extractAudio(
        dto.youtubeUrl,
        dto.startTime,
        dto.endTime
      );

      const fileId = await this.minimaxService.uploadFile(audioPath);

      await this.minimaxService.cloneVoice(fileId, voiceId);

      const voice = await this.prisma.voice.create({
        data: {
          minimaxVoiceId: voiceId,
          name: dto.voiceName,
          sourceUrl: dto.youtubeUrl,
          userId,
          status: 'active',
        },
      });

      return {
        id: voice.id,
        voiceId,
        voiceName: dto.voiceName,
        status: 'success',
        createdAt: voice.createdAt,
      };
    } finally {
      if (audioPath) {
        this.youtubeService.cleanupFile(audioPath);
      }
    }
  }

  async getVoices(userId: string) {
    return this.prisma.voice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteVoice(userId: string, voiceId: string) {
    const voice = await this.prisma.voice.findFirst({
      where: { id: voiceId, userId },
    });

    if (!voice) {
      throw new NotFoundException('Voice not found');
    }

    await this.minimaxService.deleteVoice(voice.minimaxVoiceId);

    await this.prisma.voice.delete({ where: { id: voiceId } });

    this.logger.log(`Voice deleted: ${voice.minimaxVoiceId}`);

    return { id: voiceId };
  }
}
