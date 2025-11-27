/**
 * Programs Module
 * 
 * This file defines the Programs module, which encapsulates all program-related
 * functionality. Modules in NestJS organize code into cohesive units.
 * 
 * This module:
 * - Registers the Program entity with TypeORM for database access
 * - Provides ProgramsService for business logic
 * - Exposes ProgramsController for HTTP endpoints
 * - Exports ProgramsService so it can be used by other modules
 * 
 * This is a feature module that can be imported into the main CMS module.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsService } from './programs.service';
import { ProgramsController } from './programs.controller';
import { Program } from '@octonyah/shared-programs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import {
  ProgramEventsPublisher,
  PROGRAM_EVENTS_CLIENT,
} from './program-events.publisher';

/**
 * Programs Module Configuration
 * 
 * - imports: Registers Program entity with TypeORM for this module
 * - controllers: Registers ProgramsController to handle HTTP requests
 * - providers: Registers ProgramsService for dependency injection
 * - exports: Makes ProgramsService available to other modules that import this one
 */
@Module({
  imports: [TypeOrmModule.forFeature([Program]), ConfigModule],
  controllers: [ProgramsController],
  providers: [
    ProgramsService,
    ProgramEventsPublisher,
    {
      provide: PROGRAM_EVENTS_CLIENT,
      useFactory: (config: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
            queue: config.get<string>('RABBITMQ_QUEUE', 'program-events'),
            queueOptions: {
              durable: true,
            },
          },
        }),
      inject: [ConfigService],
    },
  ],
  exports: [ProgramsService],
})
export class ProgramsModule {}

