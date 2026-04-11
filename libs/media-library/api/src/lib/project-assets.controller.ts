import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { ProjectAssetsService } from './project-assets.service';

@Controller('projects/:projectId/assets')
export class ProjectAssetsController {
  constructor(private readonly projectAssets: ProjectAssetsService) {}

  @Get()
  async list(
    @CurrentUser('userId') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectAssets.list(userId, projectId);
  }

  @Post(':assetId')
  async attach(
    @CurrentUser('userId') userId: string,
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.projectAssets.attach(userId, projectId, assetId);
  }

  @Delete(':assetId')
  async detach(
    @CurrentUser('userId') userId: string,
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.projectAssets.detach(userId, projectId, assetId);
  }
}
