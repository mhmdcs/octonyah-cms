import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

export interface RmqModuleOptions {
  name: string;
  queue?: string;
  prefetchCount?: number;
}

@Module({})
export class RmqModule {
  static forRootAsync(options: RmqModuleOptions): DynamicModule {
    return {
      module: RmqModule,
      imports: [
        ConfigModule,
        ClientsModule.registerAsync([
          {
            name: options.name,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [config.get<string>('RABBITMQ_URL', 'amqp://localhost:5672')],
                queue: options.queue || config.get<string>('RABBITMQ_QUEUE', 'program-events'),
                queueOptions: {
                  durable: true,
                },
                prefetchCount: options.prefetchCount || parseInt(
                  config.get<string>('RABBITMQ_PREFETCH') || '1',
                  10,
                ),
              },
            }),
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }

  static forMicroservice(options?: {
    queue?: string;
    prefetchCount?: number;
  }): {
    transport: Transport.RMQ;
    options: {
      urls: string[];
      queue: string;
      queueOptions: { durable: boolean };
      prefetchCount: number;
    };
  } {
    return {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
        queue: options?.queue || process.env.RABBITMQ_QUEUE || 'program-events',
        queueOptions: {
          durable: true,
        },
        prefetchCount: options?.prefetchCount || parseInt(
          process.env.RABBITMQ_PREFETCH || '1',
          10,
        ),
      },
    };
  }
}

