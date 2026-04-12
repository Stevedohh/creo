import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StorageModule } from '@creo/storage-api';
import { VideoRenderController } from './video-render.controller';
import { VideoRenderService } from './video-render.service';
import { RENDER_QUEUE } from './video-render.constants';

/**
 * Two static builders to keep chromium/puppeteer deps out of the API
 * bundle. `apps/api` imports `forHttp()` (controller + service only).
 * `apps/render-worker` imports `forWorker()` (processor only, loaded
 * lazily so the `apps/api` webpack build never pulls puppeteer).
 */
@Module({})
export class VideoRenderModule {
  static forHttp(): DynamicModule {
    return {
      module: VideoRenderModule,
      imports: [
        StorageModule,
        BullModule.registerQueue({
          name: RENDER_QUEUE,
          defaultJobOptions: {
            attempts: 1,
            removeOnComplete: { age: 24 * 3600, count: 200 },
            removeOnFail: { age: 7 * 24 * 3600 },
          },
        }),
      ],
      controllers: [VideoRenderController],
      providers: [VideoRenderService],
      exports: [VideoRenderService],
    };
  }

  static async forWorker(): Promise<DynamicModule> {
    // Lazy-import so the api webpack build never resolves the processor
    // file (and therefore never tries to bundle @remotion/renderer or
    // Chromium).
    const { VideoRenderProcessor } = await import('./video-render.processor.js');
    const { RemotionRenderer } = await import('./remotion-renderer.js');
    const { AssetResolver } = await import('./asset-resolver.js');
    return {
      module: VideoRenderModule,
      imports: [
        StorageModule,
        BullModule.registerQueue({
          name: RENDER_QUEUE,
          defaultJobOptions: {
            attempts: 1,
            removeOnComplete: { age: 24 * 3600, count: 200 },
            removeOnFail: { age: 7 * 24 * 3600 },
          },
        }),
      ],
      providers: [VideoRenderProcessor, RemotionRenderer, AssetResolver],
      exports: [],
    };
  }
}
