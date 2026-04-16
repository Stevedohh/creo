import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { MediaAssetsService } from './media-assets.service';
import { UploadInitDto } from './dto/upload-init.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { CreateFromRenderDto } from './dto/create-from-render.dto';

@Controller('media')
export class MediaAssetsController {
  constructor(private readonly mediaService: MediaAssetsService) {}

  @Get()
  async findAll(
    @CurrentUser('userId') userId: string,
    @Query('folderId') folderId?: string,
    @Query('search') search?: string,
  ) {
    return this.mediaService.findAll(userId, folderId || undefined, search || undefined);
  }

  @Post('upload-init')
  async initUpload(
    @CurrentUser('userId') userId: string,
    @Body() dto: UploadInitDto,
  ) {
    return this.mediaService.initUpload(userId, dto);
  }

  @Post(':id/upload-complete')
  async completeUpload(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.mediaService.completeUpload(userId, id);
  }

  @Post('from-render')
  async createFromRender(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateFromRenderDto,
  ) {
    return this.mediaService.createFromRender(userId, dto);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.mediaService.findOneWithUrl(userId, id);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.mediaService.update(userId, id, dto);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.mediaService.delete(userId, id);
  }
}
