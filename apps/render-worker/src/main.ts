import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { buildAppModule } from './app/app.module';

async function bootstrap() {
  const AppModule = await buildAppModule();
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
  });
  await app.init();
  Logger.log('🎬 Render worker started — listening on "video-render" queue');

  const shutdown = async (signal: string) => {
    Logger.log(`Received ${signal}, shutting down render worker`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap();
