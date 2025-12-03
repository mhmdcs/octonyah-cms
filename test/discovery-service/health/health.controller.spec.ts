// Mock @elastic/elasticsearch FIRST before any imports
jest.mock('@elastic/elasticsearch', () => ({
  errors: {
    ResponseError: class ResponseError extends Error {
      statusCode: number;
      constructor(message: string, statusCode: number = 404) {
        super(message);
        this.statusCode = statusCode;
      }
    },
  },
}));

// Mock @nestjs/elasticsearch before imports
jest.mock('@nestjs/elasticsearch', () => ({
  ElasticsearchService: jest.fn(),
  ElasticsearchModule: {
    registerAsync: jest.fn().mockReturnValue({ module: class {} }),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from '@discovery/health/health.controller';
import { RedisHealthIndicator } from '@discovery/health/redis-health.indicator';
import { ElasticsearchHealthIndicator } from '@discovery/health/elasticsearch-health.indicator';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockTypeOrmHealthIndicator = {
    pingCheck: jest.fn(),
  };

  const mockRedisHealthIndicator = {
    isHealthy: jest.fn(),
  };

  const mockElasticsearchHealthIndicator = {
    isHealthy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: TypeOrmHealthIndicator, useValue: mockTypeOrmHealthIndicator },
        { provide: RedisHealthIndicator, useValue: mockRedisHealthIndicator },
        { provide: ElasticsearchHealthIndicator, useValue: mockElasticsearchHealthIndicator },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check result with all services healthy', async () => {
      const healthResult = {
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          elasticsearch: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          elasticsearch: { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(healthResult);

      const result = await controller.check();

      expect(result).toEqual(healthResult);
      expect(mockHealthCheckService.check).toHaveBeenCalled();
    });

    it('should call all health indicators', async () => {
      const healthResult = { status: 'ok', info: {}, error: {}, details: {} };
      mockHealthCheckService.check.mockImplementation(async (checks) => {
        for (const checkFn of checks) {
          await checkFn();
        }
        return healthResult;
      });

      await controller.check();

      expect(mockTypeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith('database');
      expect(mockRedisHealthIndicator.isHealthy).toHaveBeenCalledWith('redis');
      expect(mockElasticsearchHealthIndicator.isHealthy).toHaveBeenCalledWith('elasticsearch');
    });

    it('should handle unhealthy services', async () => {
      const healthResult = {
        status: 'error',
        info: {
          database: { status: 'up' },
        },
        error: {
          redis: { status: 'down', message: 'Connection refused' },
        },
        details: {
          database: { status: 'up' },
          redis: { status: 'down', message: 'Connection refused' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(healthResult);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(result.error?.redis).toBeDefined();
    });
  });
});

