import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './discovery.controller';
import { ProgramEventsListener } from './program-events.listener';
import { Program } from '@octonyah/shared-programs';
import { RedisCacheModule } from '@octonyah/shared-cache';
import { SearchModule } from '../search/search.module';
import { JobsModule } from '../jobs/jobs.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([Program]),
    RedisCacheModule,
    SearchModule,
    JobsModule,
  ],
  controllers: [DiscoveryController, ProgramEventsListener],
  providers: [DiscoveryService],
})
export class DiscoveryModule {}
