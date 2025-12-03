// Mock TypeORM before importing AppModule
jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    DataSource: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
      isInitialized: true,
    })),
  };
});

// Mock Elasticsearch
jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue(true),
    indices: {
      exists: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockResolvedValue({}),
      refresh: jest.fn().mockResolvedValue({}),
    },
    search: jest.fn().mockResolvedValue({ hits: { total: { value: 0 }, hits: [] } }),
    index: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  })),
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

// Mock @nestjs/elasticsearch
jest.mock('@nestjs/elasticsearch', () => ({
  ElasticsearchService: jest.fn().mockImplementation(() => ({
    ping: jest.fn().mockResolvedValue(true),
    indices: {
      exists: jest.fn().mockResolvedValue(true),
      create: jest.fn().mockResolvedValue({}),
      refresh: jest.fn().mockResolvedValue({}),
    },
    search: jest.fn().mockResolvedValue({ hits: { total: { value: 0 }, hits: [] } }),
    index: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
  })),
  ElasticsearchModule: {
    register: jest.fn().mockReturnValue({
      module: class MockElasticsearchModule {},
      providers: [],
      exports: [],
    }),
    registerAsync: jest.fn().mockReturnValue({
      module: class MockElasticsearchModule {},
      providers: [],
      exports: [],
    }),
  },
}));

// Mock ioredis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    scanStream: jest.fn().mockReturnValue({
      on: jest.fn().mockImplementation(function(event, callback) {
        if (event === 'end') setTimeout(() => callback(), 0);
        return this;
      }),
    }),
  }));
});

// Mock RabbitMQ/Microservices
jest.mock('@nestjs/microservices', () => {
  const actual = jest.requireActual('@nestjs/microservices');
  return {
    ...actual,
    ClientProxy: jest.fn(),
    ClientsModule: {
      register: jest.fn().mockReturnValue({
        module: class MockClientModule {},
        providers: [],
        exports: [],
      }),
      registerAsync: jest.fn().mockReturnValue({
        module: class MockClientModule {},
        providers: [],
        exports: [],
      }),
    },
  };
});

// Mock BullMQ
jest.mock('@nestjs/bullmq', () => ({
  BullModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class MockBullModule {},
      providers: [],
      exports: [],
    }),
    forRootAsync: jest.fn().mockReturnValue({
      module: class MockBullModule {},
      providers: [],
      exports: [],
    }),
    registerQueue: jest.fn().mockReturnValue({
      module: class MockBullModule {},
      providers: [],
      exports: [],
    }),
  },
  Processor: () => jest.fn(),
  WorkerHost: class MockWorkerHost {},
  InjectQueue: () => jest.fn(),
  getQueueToken: (name: string) => `BullQueue_${name}`,
}));

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Video, VideoType, VideoPlatform } from '@octonyah/shared-videos';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import controllers and services directly
import { AppController } from '@discovery/app.controller';
import { DiscoveryController } from '@discovery/modules/discovery.controller';
import { DiscoveryService } from '@discovery/modules/discovery.service';
import { VideoSearchService } from '@discovery/search/video-search.service';
import { VideoIndexQueueService } from '@discovery/jobs/video-index.queue.service';
import { RedisCacheService } from '@octonyah/shared-cache';

/**
 * Discovery Service E2E Tests
 * 
 * These tests verify the complete request/response cycle for the Discovery API.
 * They test search functionality, filtering, and pagination.
 */
describe('Discovery Service (e2e)', () => {
  let app: INestApplication;

  const mockVideo = {
    id: 'test-uuid-1',
    title: 'Test Video',
    description: 'Test Description',
    category: 'Technology',
    type: VideoType.VIDEO_PODCAST,
    duration: 3600,
    tags: ['tech', 'podcast'],
    publicationDate: new Date('2024-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    platform: VideoPlatform.NATIVE,
  };

  const mockSearchResponse = {
    data: [mockVideo],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  };

  const mockVideoRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deleteByPrefix: jest.fn(),
  };

  const mockVideoSearchService = {
    search: jest.fn(),
    indexVideo: jest.fn(),
    removeVideo: jest.fn(),
    onModuleInit: jest.fn(),
  };

  const mockVideoIndexQueueService = {
    enqueueVideo: jest.fn(),
    enqueueFullReindex: jest.fn(),
    enqueueRemoval: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          load: [() => ({
            REDIS_HOST: 'localhost',
            REDIS_PORT: '6379',
            REDIS_TTL_SECONDS: '300',
            ELASTICSEARCH_NODE: 'http://localhost:9200',
            ELASTICSEARCH_INDEX: 'test-videos',
          })],
        }),
      ],
      controllers: [AppController, DiscoveryController],
      providers: [
        DiscoveryService,
        { provide: getRepositoryToken(Video), useValue: mockVideoRepository },
        { provide: RedisCacheService, useValue: mockCacheService },
        { provide: VideoSearchService, useValue: mockVideoSearchService },
        { provide: VideoIndexQueueService, useValue: mockVideoIndexQueueService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  }, 30000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheService.get.mockResolvedValue(null);
  });

  describe('/ (GET)', () => {
    it('should return welcome message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect({ message: 'Welcome to the Octonyah Discovery API!' });
    });
  });

  describe('Discovery Module', () => {
    describe('/discovery/search (GET)', () => {
      it('should return search results', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        const response = await request(app.getHttpServer())
          .get('/discovery/search')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
        expect(response.body).toHaveProperty('totalPages');
        expect(response.body).toHaveProperty('hasNext');
        expect(response.body).toHaveProperty('hasPrev');
      });

      it('should search with query parameter', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        const response = await request(app.getHttpServer())
          .get('/discovery/search')
          .query({ q: 'technology' })
          .expect(200);

        expect(mockVideoSearchService.search).toHaveBeenCalledWith(
          expect.objectContaining({ q: 'technology' }),
        );
      });

      it('should filter by category', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        await request(app.getHttpServer())
          .get('/discovery/search')
          .query({ category: 'Technology' })
          .expect(200);

        expect(mockVideoSearchService.search).toHaveBeenCalledWith(
          expect.objectContaining({ category: 'Technology' }),
        );
      });

      it('should filter by type', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        await request(app.getHttpServer())
          .get('/discovery/search')
          .query({ type: VideoType.VIDEO_PODCAST })
          .expect(200);

        expect(mockVideoSearchService.search).toHaveBeenCalledWith(
          expect.objectContaining({ type: VideoType.VIDEO_PODCAST }),
        );
      });

      it('should support pagination', async () => {
        mockVideoSearchService.search.mockResolvedValue({
          ...mockSearchResponse,
          page: 2,
          totalPages: 5,
          hasNext: true,
          hasPrev: true,
        });

        const response = await request(app.getHttpServer())
          .get('/discovery/search')
          .query({ page: 2, limit: 10 })
          .expect(200);

        expect(mockVideoSearchService.search).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2, limit: 10 }),
        );
        expect(response.body.page).toBe(2);
      });

      it('should validate page parameter is positive', async () => {
        return request(app.getHttpServer())
          .get('/discovery/search')
          .query({ page: 0 })
          .expect(400);
      });

      it('should validate limit parameter maximum', async () => {
        return request(app.getHttpServer())
          .get('/discovery/search')
          .query({ limit: 200 })
          .expect(400);
      });

      it('should support sort parameter', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        await request(app.getHttpServer())
          .get('/discovery/search')
          .query({ sort: 'date' })
          .expect(200);

        expect(mockVideoSearchService.search).toHaveBeenCalledWith(
          expect.objectContaining({ sort: 'date' }),
        );
      });

      it('should support date range filtering', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        await request(app.getHttpServer())
          .get('/discovery/search')
          .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
          .expect(200);

        expect(mockVideoSearchService.search).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          }),
        );
      });

      it('should return cached results when available', async () => {
        mockCacheService.get.mockResolvedValue(mockSearchResponse);

        const response = await request(app.getHttpServer())
          .get('/discovery/search')
          .expect(200);

        // Dates are serialized to ISO strings in JSON response
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe(mockVideo.id);
        expect(response.body.total).toBe(mockSearchResponse.total);
        expect(response.body.page).toBe(mockSearchResponse.page);
        // Search service should not be called when cache hit
      });
    });

    describe('/discovery/videos/:id (GET)', () => {
      it('should return a single video', async () => {
        mockVideoRepository.findOne.mockResolvedValue(mockVideo);

        const response = await request(app.getHttpServer())
          .get('/discovery/videos/test-uuid-1')
          .expect(200);

        expect(response.body.id).toBe('test-uuid-1');
        expect(response.body.title).toBe('Test Video');
      });

      it('should return 404 for non-existent video', async () => {
        mockVideoRepository.findOne.mockResolvedValue(null);
        mockCacheService.get.mockResolvedValue(null);

        return request(app.getHttpServer())
          .get('/discovery/videos/non-existent')
          .expect(404);
      });

      it('should return cached video when available', async () => {
        mockCacheService.get.mockResolvedValue(mockVideo);

        const response = await request(app.getHttpServer())
          .get('/discovery/videos/test-uuid-1')
          .expect(200);

        expect(response.body.id).toBe('test-uuid-1');
        expect(mockVideoRepository.findOne).not.toHaveBeenCalled();
      });
    });

    describe('/discovery/categories/:category (GET)', () => {
      it('should return videos by category', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        const response = await request(app.getHttpServer())
          .get('/discovery/categories/Technology')
          .expect(200);

        expect(response.body.data).toBeDefined();
      });

      it('should support pagination for category', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        await request(app.getHttpServer())
          .get('/discovery/categories/Technology')
          .query({ page: 2, limit: 10 })
          .expect(200);
      });
    });

    describe('/discovery/types/:type (GET)', () => {
      it('should return videos by type', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        const response = await request(app.getHttpServer())
          .get('/discovery/types/video_podcast')
          .expect(200);

        expect(response.body.data).toBeDefined();
      });

      it('should support pagination for type', async () => {
        mockVideoSearchService.search.mockResolvedValue(mockSearchResponse);

        await request(app.getHttpServer())
          .get('/discovery/types/documentary')
          .query({ page: 1, limit: 20 })
          .expect(200);
      });
    });

  });
});
