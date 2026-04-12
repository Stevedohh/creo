import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '@creo/auth-api';
import { MediaFoldersService } from './media-folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RenameFolderDto } from './dto/rename-folder.dto';

@Controller('media/folders')
export class MediaFoldersController {
  constructor(private readonly folders: MediaFoldersService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateFolderDto,
  ) {
    return this.folders.create(userId, dto.name, dto.parentId);
  }

  @Get()
  async list(
    @CurrentUser('userId') userId: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.folders.list(userId, parentId || undefined);
  }

  @Get(':id/breadcrumbs')
  async breadcrumbs(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.folders.breadcrumbs(userId, id);
  }

  @Patch(':id')
  async rename(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: RenameFolderDto,
  ) {
    return this.folders.rename(userId, id, dto.name);
  }

  @Delete(':id')
  async delete(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.folders.delete(userId, id);
  }
}
