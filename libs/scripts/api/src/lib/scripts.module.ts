import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { VoiceCloneModule } from '@creo/voice-clone-api';
import { ScriptsController } from './scripts.controller';
import { ScriptsService } from './scripts.service';
import { ScriptsAiService } from './scripts-ai.service';
import { OpenRouterService } from './openrouter.service';
import { VoiceoverController } from './voiceover.controller';
import { VoiceoverService } from './voiceover.service';
import { VoiceoverIngestProcessor } from './voiceover-ingest.processor';
import { VOICEOVER_INGEST_QUEUE } from './voiceover-ingest.constants';

@Module({
  imports: [
    VoiceCloneModule,
    BullModule.registerQueue({
      name: VOICEOVER_INGEST_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 24 * 3600, count: 500 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    }),
  ],
  controllers: [ScriptsController, VoiceoverController],
  providers: [
    ScriptsService,
    ScriptsAiService,
    OpenRouterService,
    VoiceoverService,
    VoiceoverIngestProcessor,
  ],
  exports: [ScriptsService],
})
export class ScriptsModule {}
