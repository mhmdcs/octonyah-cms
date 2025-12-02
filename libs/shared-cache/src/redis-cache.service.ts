import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly client: RedisClient;
  private readonly defaultTtlSeconds: number;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = parseInt(
      this.configService.get<string>('REDIS_PORT', '6379'),
      10,
    );
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.client = redisUrl
      ? new Redis(redisUrl)
      : new Redis({
          host,
          port,
          password: password,
        });

    this.defaultTtlSeconds = parseInt(
      this.configService.get<string>('REDIS_TTL_SECONDS') || '300',
      10,
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      this.logger.warn(`Failed to parse cache value for key ${key}`);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlSeconds: number = this.defaultTtlSeconds,
  ): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    await this.deleteByPattern(`${prefix}:*`);
  }

  private async deleteByPattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({
      match: pattern,
      count: 100,
    });

    return new Promise<void>((resolve, reject) => {
      stream.on('data', (keys: string[]) => {
        if (keys.length) {
          this.client.del(...keys).catch((error) =>
            this.logger.error(`Failed to delete keys for pattern ${pattern}`, error),
          );
        }
      });

      stream.on('end', () => resolve());
      stream.on('error', (error) => reject(error));
    });
  }
}

