import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { Program } from '@octonyah/shared-programs';
import { ConfigModule } from '@nestjs/config';
import {
  ProgramEventsPublisher,
  PROGRAM_EVENTS_CLIENT,
  RmqModule,
} from '@octonyah/shared-events';
import { StorageModule } from '@octonyah/shared-storage';

@Module({
  imports: [
    TypeOrmModule.forFeature([Program]),
    ConfigModule,
    StorageModule,
    RmqModule.forRootAsync({
      name: PROGRAM_EVENTS_CLIENT,
    }),
  ],
  controllers: [ProgramsController],
  providers: [ProgramsService, ProgramEventsPublisher],
  exports: [ProgramsService],
})
export class ProgramsModule {}

