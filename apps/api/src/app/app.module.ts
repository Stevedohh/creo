import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VoiceCloneModule } from '@creo/voice-clone-api';
import { ScriptsModule } from '@creo/scripts-api';
import { ProjectsModule } from '@creo/projects-api';
import { PrismaModule } from '@creo/prisma';
import { StorageModule } from '@creo/storage-api';
import { AuthModule, JwtAuthGuard } from '@creo/auth-api';

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
    AuthModule,
    VoiceCloneModule,
    ScriptsModule,
    ProjectsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
