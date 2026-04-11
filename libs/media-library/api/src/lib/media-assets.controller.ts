import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { MediaAssetsService } from './media-assets.service';
import { UploadInitDto } from './dto/upload-init.dto';

@Controller('media')
export class MediaAssetsController {
  constructor(private readonly mediaService: MediaAssetsService) {}

  @Get()
  async findAll(@CurrentUser('userId') userId: string) {
    return this.mediaService.findAll(userId);
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

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.mediaService.findOneWithUrl(userId, id);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.mediaService.delete(userId, id);
  }
}
