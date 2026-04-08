import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VoiceCloneModule } from '@creo/voice-clone-api';
import { ScriptsModule } from '@creo/scripts-api';
import { PrismaModule } from '@creo/prisma';
import { AuthModule, JwtAuthGuard } from '@creo/auth-api';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    VoiceCloneModule,
    ScriptsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
