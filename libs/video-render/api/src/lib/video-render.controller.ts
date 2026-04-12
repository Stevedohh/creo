import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { VideoRenderService } from './video-render.service';
import { StartDocumentRenderDto } from './dto/start-document-render.dto';

@Controller('render')
export class VideoRenderController {
  constructor(private readonly renderService: VideoRenderService) {}

  @Post('projects/:projectId')
  async startRender(
    @CurrentUser('userId') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.renderService.startRender(userId, projectId);
  }

  @Post('document')
  async startDocumentRender(
    @CurrentUser('userId') userId: string,
    @Body() dto: StartDocumentRenderDto,
  ) {
    return this.renderService.startDocumentRender(
      userId,
      dto.document,
      dto.exportSettings,
    );
  }

  @Get('jobs/:id')
  async getJob(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.renderService.findJob(userId, id);
  }

  @Post('jobs/:id/cancel')
  async cancelJob(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.renderService.cancel(userId, id);
  }
}
