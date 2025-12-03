import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import {
  CMS_DEFAULT_THROTTLE,
  DISCOVERY_DEFAULT_THROTTLE,
} from './throttler.constants';

export interface ThrottlerRedisModuleOptions {
  /** Default TTL in milliseconds */
  ttl?: number;
  /** Default request limit */
  limit?: number;
  /** Service type for default limits */
  serviceType?: 'cms' | 'discovery';
}

@Module({})
export class ThrottlerRedisModule {
  /**
   * Register the throttler module with Redis storage.
   * Uses environment variables for Redis connection.
   */
  static forRoot(options?: ThrottlerRedisModuleOptions): DynamicModule {
    const defaults =
      options?.serviceType === 'discovery'
        ? DISCOVERY_DEFAULT_THROTTLE
        : CMS_DEFAULT_THROTTLE;

    return {
      module: ThrottlerRedisModule,
      imports: [
        ThrottlerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService): ThrottlerModuleOptions => {
            const redisUrl = config.get<string>('REDIS_URL');
            const redis = redisUrl
              ? new Redis(redisUrl)
              : new Redis({
                  host: config.get('REDIS_HOST', 'localhost'),
                  port: parseInt(config.get('REDIS_PORT', '6379'), 10),
                  password: config.get<string>('REDIS_PASSWORD'),
                });

            return {
              throttlers: [
                {
                  ttl: options?.ttl ?? defaults.ttl,
                  limit: options?.limit ?? defaults.limit,
                },
              ],
              storage: new ThrottlerStorageRedisService(redis),
              errorMessage:
                'Too many requests. Please slow down and try again later.',
            };
          },
        }),
      ],
      exports: [ThrottlerModule],
    };
  }
}

