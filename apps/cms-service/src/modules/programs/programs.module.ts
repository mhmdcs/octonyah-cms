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

