import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from '@octonyah/shared-videos';
import { VIDEO_INDEX_QUEUE } from './video-index.queue';
import { VideoIndexQueueService } from './video-index.queue.service';
import { VideoIndexProcessor } from './video-index.processor';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: VIDEO_INDEX_QUEUE,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
          password: config.get<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    TypeOrmModule.forFeature([Video]),
    SearchModule,
  ],
  providers: [VideoIndexQueueService, VideoIndexProcessor],
  exports: [VideoIndexQueueService],
})
export class JobsModule {}
