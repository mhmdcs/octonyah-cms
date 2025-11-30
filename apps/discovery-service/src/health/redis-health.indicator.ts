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
      // Try to set and get a test key to verify Redis connectivity
      const testKey = `health-check:${Date.now()}`;
      await this.redisCacheService.set(testKey, 'ok', 1);
      const value = await this.redisCacheService.get<string>(testKey);
      await this.redisCacheService.delete(testKey);

      const isHealthy = value === 'ok';
      const result = this.getStatus(key, isHealthy);

      if (isHealthy) {
        return result;
      }

      throw new HealthCheckError('Redis health check failed', result);
    } catch (error) {
      throw new HealthCheckError('Redis health check failed', this.getStatus(key, false, { message: error.message }));
    }
  }
}

