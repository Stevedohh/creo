import { Module } from '@nestjs/common';
import { VoiceCloneController } from './voice-clone.controller';
import { VoiceCloneService } from './voice-clone.service';
import { YoutubeService } from './youtube.service';
import { MinimaxService } from './minimax.service';

@Module({
  controllers: [VoiceCloneController],
  providers: [VoiceCloneService, YoutubeService, MinimaxService],
  exports: [VoiceCloneService],
})
export class VoiceCloneModule {}
