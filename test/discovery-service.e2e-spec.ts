import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoType, VideoPlatform } from '@octonyah/shared-videos';
import { AppModule } from '../apps/discovery-service/src/app.module';
import { RedisCacheService } from '@octonyah/shared-cache';
import { VideoSearchService } from '../apps/discovery-service/src/search/video-search.service';
import { VideoIndexQueueService } from '../apps/discovery-service/src/jobs/video-index.queue.service';

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
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Video))
      .useValue(mockVideoRepository)
      .overrideProvider(RedisCacheService)
      .useValue(mockCacheService)
      .overrideProvider(VideoSearchService)
      .useValue(mockVideoSearchService)
      .overrideProvider(VideoIndexQueueService)
      .useValue(mockVideoIndexQueueService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
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

        expect(response.body).toEqual(mockSearchResponse);
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

    describe('/discovery/search/reindex (POST)', () => {
      it('should enqueue reindex job', async () => {
        mockVideoIndexQueueService.enqueueFullReindex.mockResolvedValue(undefined);

        const response = await request(app.getHttpServer())
          .post('/discovery/search/reindex')
          .expect(201);

        expect(response.body).toEqual({ status: 'scheduled' });
        expect(mockVideoIndexQueueService.enqueueFullReindex).toHaveBeenCalled();
      });
    });
  });
});

