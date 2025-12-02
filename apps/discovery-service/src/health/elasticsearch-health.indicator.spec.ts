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

// Mock @nestjs/elasticsearch before importing the indicator
jest.mock('@nestjs/elasticsearch', () => ({
  ElasticsearchService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckError } from '@nestjs/terminus';
import { ElasticsearchHealthIndicator } from './elasticsearch-health.indicator';

describe('ElasticsearchHealthIndicator', () => {
  let indicator: ElasticsearchHealthIndicator;

  const mockElasticsearchService = {
    ping: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ElasticsearchHealthIndicator,
        { provide: 'ElasticsearchService', useValue: mockElasticsearchService },
      ],
    })
      .overrideProvider(ElasticsearchHealthIndicator)
      .useFactory({
        factory: () => {
          const indicator = new ElasticsearchHealthIndicator(mockElasticsearchService as any);
          return indicator;
        },
      })
      .compile();

    indicator = module.get<ElasticsearchHealthIndicator>(ElasticsearchHealthIndicator);
  });

  it('should be defined', () => {
    expect(indicator).toBeDefined();
  });

  describe('isHealthy', () => {
    it('should return healthy status when Elasticsearch ping returns true', async () => {
      mockElasticsearchService.ping.mockResolvedValue(true);

      const result = await indicator.isHealthy('elasticsearch');

      expect(result).toEqual({
        elasticsearch: { status: 'up' },
      });
    });

    it('should throw HealthCheckError when ping returns false', async () => {
      mockElasticsearchService.ping.mockResolvedValue(false);

      await expect(indicator.isHealthy('elasticsearch')).rejects.toThrow(HealthCheckError);
    });

    it('should throw HealthCheckError when ping throws error', async () => {
      mockElasticsearchService.ping.mockRejectedValue(new Error('Connection refused'));

      await expect(indicator.isHealthy('elasticsearch')).rejects.toThrow(HealthCheckError);
    });

    it('should include error message in health check error', async () => {
      mockElasticsearchService.ping.mockRejectedValue(new Error('ECONNREFUSED'));

      try {
        await indicator.isHealthy('elasticsearch');
      } catch (error) {
        expect(error).toBeInstanceOf(HealthCheckError);
        expect(error.message).toBe('Elasticsearch health check failed');
      }
    });
  });
});
