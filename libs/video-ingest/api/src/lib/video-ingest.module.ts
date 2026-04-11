import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from '@creo/storage-api';
import { VideoIngestController } from './video-ingest.controller';
import { VideoIngestService } from './video-ingest.service';
import { YoutubeIngestProcessor } from './youtube-ingest.processor';
import { YOUTUBE_INGEST_QUEUE } from './youtube-ingest.constants';

@Module({
  imports: [
    StorageModule,
    BullModule.registerQueue({
      name: YOUTUBE_INGEST_QUEUE,
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: { age: 24 * 3600, count: 500 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    }),
  ],
  controllers: [VideoIngestController],
  providers: [VideoIngestService, YoutubeIngestProcessor],
  exports: [VideoIngestService],
})
export class VideoIngestModule {}
