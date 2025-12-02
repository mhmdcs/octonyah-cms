import { Module } from '@nestjs/common';
import { VideosModule } from './videos/videos.module';

@Module({
  imports: [VideosModule],
  exports: [VideosModule],
})
export class CmsModule {}

