import { Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { VideoAnalysisService } from './video-analysis.service';

@Controller('analyze')
export class VideoAnalysisController {
  constructor(private readonly service: VideoAnalysisService) {}

  @Post(':assetId')
  async enqueue(
    @CurrentUser('userId') userId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.service.enqueue(userId, assetId);
  }

  @Get(':assetId')
  async get(
    @CurrentUser('userId') userId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.service.getAnalysis(userId, assetId);
  }
}
