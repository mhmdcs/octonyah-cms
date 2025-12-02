import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { RedisCacheService } from '@octonyah/shared-cache';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisCacheService: RedisCacheService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const testKey = `health-check:${Date.now()}`;
      await this.redisCacheService.set(testKey, 'ok', 1);
      const isHealthy = (await this.redisCacheService.get<string>(testKey)) === 'ok';
      await this.redisCacheService.delete(testKey);
      if (isHealthy) return this.getStatus(key, true);
      throw new HealthCheckError('Redis health check failed', this.getStatus(key, false));
    } catch (error) {
      throw new HealthCheckError('Redis health check failed', this.getStatus(key, false, { message: error.message }));
    }
  }
}

