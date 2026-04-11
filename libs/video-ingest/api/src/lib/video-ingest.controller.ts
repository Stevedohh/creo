import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { VideoIngestService } from './video-ingest.service';
import { IngestYoutubeDto } from './dto/ingest-youtube.dto';

@Controller('ingest')
export class VideoIngestController {
  constructor(private readonly ingestService: VideoIngestService) {}

  @Post('youtube')
  async ingestYoutube(
    @CurrentUser('userId') userId: string,
    @Body() dto: IngestYoutubeDto,
  ) {
    return this.ingestService.ingestYoutube(userId, dto);
  }

  @Get('jobs')
  async listJobs(@CurrentUser('userId') userId: string) {
    return this.ingestService.listJobs(userId);
  }

  @Get('jobs/:id')
  async getJob(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.ingestService.findJob(userId, id);
  }
}
