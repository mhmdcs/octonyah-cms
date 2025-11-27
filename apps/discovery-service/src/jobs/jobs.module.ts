import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Program } from '@octonyah/shared-programs';
import { PROGRAM_INDEX_QUEUE } from './program-index.queue';
import { ProgramIndexQueueService } from './program-index.queue.service';
import { ProgramIndexProcessor } from './program-index.processor';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [
    BullModule.registerQueueAsync({
      name: PROGRAM_INDEX_QUEUE,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
          password: config.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    TypeOrmModule.forFeature([Program]),
    SearchModule,
  ],
  providers: [ProgramIndexQueueService, ProgramIndexProcessor],
  exports: [ProgramIndexQueueService],
})
export class JobsModule {}
