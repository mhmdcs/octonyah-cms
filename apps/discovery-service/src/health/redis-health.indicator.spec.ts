import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckError } from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis-health.indicator';
import { RedisCacheService } from '@octonyah/shared-cache';

describe('RedisHealthIndicator', () => {
  let indicator: RedisHealthIndicator;
  let cacheService: RedisCacheService;

  const mockCacheService = {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisHealthIndicator,
        { provide: RedisCacheService, useValue: mockCacheService },
      ],
    }).compile();

    indicator = module.get<RedisHealthIndicator>(RedisHealthIndicator);
    cacheService = module.get<RedisCacheService>(RedisCacheService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when Redis is working', async () => {
      mockCacheService.set.mockResolvedValue(undefined);
      mockCacheService.get.mockResolvedValue('ok');
      mockCacheService.delete.mockResolvedValue(undefined);

      const result = await indicator.isHealthy('redis');

      expect(result).toEqual({
        redis: { status: 'up' },
      });
    });

    it('should throw HealthCheckError when Redis read fails', async () => {
      mockCacheService.set.mockResolvedValue(undefined);
      mockCacheService.get.mockResolvedValue(null); // Health check value not found

      await expect(indicator.isHealthy('redis')).rejects.toThrow(HealthCheckError);
    });

    it('should throw HealthCheckError when Redis set fails', async () => {
      mockCacheService.set.mockRejectedValue(new Error('Connection refused'));

      await expect(indicator.isHealthy('redis')).rejects.toThrow(HealthCheckError);
    });

    it('should cleanup health check key after successful check', async () => {
      mockCacheService.set.mockResolvedValue(undefined);
      mockCacheService.get.mockResolvedValue('ok');
      mockCacheService.delete.mockResolvedValue(undefined);

      await indicator.isHealthy('redis');

      expect(mockCacheService.delete).toHaveBeenCalled();
    });
  });
});

