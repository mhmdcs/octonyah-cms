import { ConfigService } from '@nestjs/config';

// Create a mock Redis client before importing the service
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  quit: jest.fn(),
  scanStream: jest.fn(),
};

// Mock ioredis before importing the service
jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => mockRedisClient),
  };
});

// Now import the service after mocking ioredis
import { RedisCacheService } from '@octonyah/shared-cache/redis-cache.service';

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
        REDIS_TTL_SECONDS: '300',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RedisCacheService(mockConfigService as unknown as ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should return parsed JSON value from cache', async () => {
      const mockData = { name: 'test', value: 123 };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await service.get<typeof mockData>('test-key');

      expect(result).toEqual(mockData);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when JSON parsing fails', async () => {
      mockRedisClient.get.mockResolvedValue('invalid-json{');

      const result = await service.get('bad-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const data = { test: 'value' };

      await service.set('test-key', data);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(data),
        'EX',
        300,
      );
    });

    it('should set value with custom TTL', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const data = { test: 'value' };

      await service.set('test-key', data, 600);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify(data),
        'EX',
        600,
      );
    });

    it('should serialize objects to JSON', async () => {
      mockRedisClient.set.mockResolvedValue('OK');
      const complexData = { array: [1, 2, 3], nested: { a: 'b' } };

      await service.set('complex-key', complexData);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'complex-key',
        JSON.stringify(complexData),
        'EX',
        expect.any(Number),
      );
    });
  });

  describe('delete', () => {
    it('should delete key from cache', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await service.delete('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });

    it('should not throw when key does not exist', async () => {
      mockRedisClient.del.mockResolvedValue(0);

      await expect(service.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('deleteByPrefix', () => {
    it('should delete all keys with given prefix', async () => {
      const mockStream = {
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(['prefix:key1', 'prefix:key2']);
          }
          if (event === 'end') {
            callback();
          }
          return mockStream;
        }),
      };
      mockRedisClient.scanStream.mockReturnValue(mockStream);
      mockRedisClient.del.mockResolvedValue(2);

      await service.deleteByPrefix('prefix');

      expect(mockRedisClient.scanStream).toHaveBeenCalledWith({
        match: 'prefix:*',
        count: 100,
      });
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis connection', async () => {
      mockRedisClient.quit.mockResolvedValue('OK');

      await service.onModuleDestroy();

      expect(mockRedisClient.quit).toHaveBeenCalled();
    });
  });
});

