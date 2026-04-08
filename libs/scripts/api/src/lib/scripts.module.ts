import { Module } from '@nestjs/common';
import { ScriptsController } from './scripts.controller';
import { ScriptsService } from './scripts.service';
import { ScriptsAiService } from './scripts-ai.service';
import { OpenRouterService } from './openrouter.service';

@Module({
  controllers: [ScriptsController],
  providers: [ScriptsService, ScriptsAiService, OpenRouterService],
  exports: [ScriptsService],
})
export class ScriptsModule {}
