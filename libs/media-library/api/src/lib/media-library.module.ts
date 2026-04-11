import { Module } from '@nestjs/common';
import { StorageModule } from '@creo/storage-api';
import { VideoAnalysisModule } from '@creo/video-analysis-api';
import { MediaAssetsController } from './media-assets.controller';
import { MediaAssetsService } from './media-assets.service';
import { ProjectAssetsController } from './project-assets.controller';
import { ProjectAssetsService } from './project-assets.service';
import { FfprobeService } from './ffprobe.service';

@Module({
  imports: [StorageModule, VideoAnalysisModule],
  controllers: [MediaAssetsController, ProjectAssetsController],
  providers: [MediaAssetsService, ProjectAssetsService, FfprobeService],
  exports: [MediaAssetsService],
})
export class MediaLibraryModule {}
