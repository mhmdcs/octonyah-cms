import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Video } from '@octonyah/shared-videos';
import { VIDEO_INDEX_QUEUE } from './video-index.queue';
import { VideoIndexQueueService } from './video-index.queue.service';
import { VideoIndexProcessor } from './video-index.processor';
import { CLEANUP_QUEUE } from './cleanup-soft-deletes.queue';
import { CleanupSoftDeletesQueueService } from './cleanup-soft-deletes.queue.service';
import { CleanupSoftDeletesProcessor } from './cleanup-soft-deletes.processor';
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
    BullModule.registerQueueAsync({
      name: CLEANUP_QUEUE,
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
  providers: [
    VideoIndexQueueService,
    VideoIndexProcessor,
    CleanupSoftDeletesQueueService,
    CleanupSoftDeletesProcessor,
  ],
  exports: [VideoIndexQueueService, CleanupSoftDeletesQueueService],
})
export class JobsModule {}
