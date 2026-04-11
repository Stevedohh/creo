import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from '@creo/storage-api';
import { VideoAnalysisController } from './video-analysis.controller';
import { VideoAnalysisService } from './video-analysis.service';
import { VideoAnalysisProcessor } from './video-analysis.processor';
import { AiWorkerClient } from './ai-worker.client';
import { VIDEO_ANALYSIS_QUEUE } from './video-analysis.constants';

@Module({
  imports: [
    StorageModule,
    BullModule.registerQueue({
      name: VIDEO_ANALYSIS_QUEUE,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 15000 },
        removeOnComplete: { age: 24 * 3600, count: 500 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    }),
  ],
  controllers: [VideoAnalysisController],
  providers: [VideoAnalysisService, VideoAnalysisProcessor, AiWorkerClient],
  exports: [VideoAnalysisService],
})
export class VideoAnalysisModule {}
