import { Module } from '@nestjs/common';
import { StorageModule } from '@creo/storage-api';
import { VideoAnalysisModule } from '@creo/video-analysis-api';
import { VideoRenderModule } from '@creo/video-render-api';
import { MediaAssetsController } from './media-assets.controller';
import { MediaAssetsService } from './media-assets.service';
import { ProjectAssetsController } from './project-assets.controller';
import { ProjectAssetsService } from './project-assets.service';
import { MediaFoldersController } from './media-folders.controller';
import { MediaFoldersService } from './media-folders.service';
import { MediaTagsController } from './media-tags.controller';
import { MediaTagsService } from './media-tags.service';
import { FfprobeService } from './ffprobe.service';

@Module({
  imports: [StorageModule, VideoAnalysisModule, VideoRenderModule.forHttp()],
  controllers: [
    MediaFoldersController,
    MediaTagsController,
    MediaAssetsController,
    ProjectAssetsController,
  ],
  providers: [
    MediaAssetsService,
    ProjectAssetsService,
    MediaFoldersService,
    MediaTagsService,
    FfprobeService,
  ],
  exports: [MediaAssetsService],
})
export class MediaLibraryModule {}
