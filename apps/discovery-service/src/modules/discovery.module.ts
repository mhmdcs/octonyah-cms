import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './discovery.controller';
import { VideoEventsListener } from './video-events.listener';
import { Video } from '@octonyah/shared-videos';
import { RedisCacheModule } from '@octonyah/shared-cache';
import { SearchModule } from '../search/search.module';
import { JobsModule } from '../jobs/jobs.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Video]),
    RedisCacheModule,
    SearchModule,
    JobsModule,
  ],
  controllers: [DiscoveryController, VideoEventsListener],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
