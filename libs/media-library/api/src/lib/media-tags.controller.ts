import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { MediaTagsService } from './media-tags.service';
import { CreateTagDto } from './dto/create-tag.dto';

@Controller('media/tags')
export class MediaTagsController {
  constructor(private readonly tags: MediaTagsService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateTagDto,
  ) {
    return this.tags.create(userId, dto.name);
  }

  @Get()
  async list(@CurrentUser('userId') userId: string) {
    return this.tags.list(userId);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.tags.delete(userId, id);
  }
}
