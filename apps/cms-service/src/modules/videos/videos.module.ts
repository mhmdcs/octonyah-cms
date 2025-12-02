import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideosService } from './videos.service';
import { VideosController } from './videos.controller';
import { Video } from '@octonyah/shared-videos';
import { ConfigModule } from '@nestjs/config';
import {
  VideoEventsPublisher,
  VIDEO_EVENTS_CLIENT,
  RmqModule,
} from '@octonyah/shared-events';
import { StorageModule } from '@octonyah/shared-storage';

@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    ConfigModule,
    StorageModule,
    RmqModule.forRootAsync({
      name: VIDEO_EVENTS_CLIENT,
    }),
  ],
  controllers: [VideosController],
  providers: [VideosService, VideoEventsPublisher],
  exports: [VideosService],
})
export class VideosModule {}

