import { Module, type DynamicModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@creo/prisma';
import { StorageModule } from '@creo/storage-api';
import { VideoRenderModule } from '@creo/video-render-api';

export async function buildAppModule(): Promise<DynamicModule> {
  const renderModule = await VideoRenderModule.forWorker();

  @Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      BullModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          connection: { url: config.getOrThrow<string>('REDIS_URL') },
        }),
      }),
      PrismaModule,
      StorageModule,
      renderModule,
    ],
  })
  class AppModule {}

  return {
    module: AppModule,
    imports: [],
  };
}
