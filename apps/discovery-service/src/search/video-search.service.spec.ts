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

// Mock @nestjs/elasticsearch before importing the service
jest.mock('@nestjs/elasticsearch', () => ({
  ElasticsearchService: jest.fn(),
  ElasticsearchModule: {
    registerAsync: jest.fn().mockReturnValue({
      module: class {},
      providers: [],
      exports: [],
    }),
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VideoType, VideoLanguage, VideoPlatform, Video } from '@octonyah/shared-videos';
import { VideoSearchService } from './video-search.service';
import { SearchVideosDto } from '../modules/dto/search-videos.dto';

describe('VideoSearchService', () => {
  let service: VideoSearchService;

  const mockElasticsearchService = {
    indices: {
      exists: jest.fn(),
      create: jest.fn(),
      refresh: jest.fn(),
    },
    search: jest.fn(),
    index: jest.fn(),
    delete: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        ELASTICSEARCH_INDEX: 'test-videos',
      };
      return config[key] ?? defaultValue;
    }),
  };

  const createMockVideo = (overrides: Partial<Video> = {}): Video => ({
    id: 'test-uuid-1',
    title: 'Test Video',
    description: 'Test Description',
    category: 'Technology',
    type: VideoType.VIDEO_PODCAST,
    language: VideoLanguage.ARABIC,
    duration: 3600,
    tags: ['tech', 'podcast'],
    popularityScore: 10,
    publicationDate: new Date('2024-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    platform: VideoPlatform.NATIVE,
    ...overrides,
  } as Video);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: VideoSearchService,
          useFactory: () => {
            // Create service manually with mocks
            const instance = Object.create(VideoSearchService.prototype);
            instance['esService'] = mockElasticsearchService;
            instance['configService'] = mockConfigService;
            instance['indexName'] = 'test-videos';
            instance['logger'] = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
            return instance;
          },
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<VideoSearchService>(VideoSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should create index if it does not exist', async () => {
      mockElasticsearchService.indices.exists.mockResolvedValue(false);
      mockElasticsearchService.indices.create.mockResolvedValue({});

      await service.onModuleInit();

      expect(mockElasticsearchService.indices.exists).toHaveBeenCalledWith({
        index: 'test-videos',
      });
      expect(mockElasticsearchService.indices.create).toHaveBeenCalled();
    });

    it('should not create index if it already exists', async () => {
      mockElasticsearchService.indices.exists.mockResolvedValue(true);

      await service.onModuleInit();

      expect(mockElasticsearchService.indices.create).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should return search results with pagination', async () => {
      const searchDto: SearchVideosDto = { q: 'test', page: 1, limit: 20 };
      const mockResponse = {
        hits: {
          total: { value: 1 },
          hits: [
            {
              _source: {
                id: 'test-uuid-1',
                title: 'Test Video',
                description: 'Test Description',
                category: 'Technology',
                type: VideoType.VIDEO_PODCAST,
                language: VideoLanguage.ARABIC,
                duration: 3600,
                tags: ['tech'],
                popularityScore: 10,
                publicationDate: '2024-01-01T00:00:00.000Z',
                platform: VideoPlatform.NATIVE,
              },
            },
          ],
        },
      };

      mockElasticsearchService.search.mockResolvedValue(mockResponse);

      const result = await service.search(searchDto);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(false);
    });

    it('should build correct query with text search', async () => {
      const searchDto: SearchVideosDto = { q: 'nestjs tutorial', page: 1, limit: 20 };
      mockElasticsearchService.search.mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] },
      });

      await service.search(searchDto);

      expect(mockElasticsearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  multi_match: expect.objectContaining({
                    query: 'nestjs tutorial',
                  }),
                }),
              ]),
            }),
          }),
        }),
      );
    });

    it('should build correct query with filters', async () => {
      const searchDto: SearchVideosDto = {
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
        language: VideoLanguage.ARABIC,
        page: 1,
        limit: 20,
      };

      mockElasticsearchService.search.mockResolvedValue({
        hits: { total: { value: 0 }, hits: [] },
      });

      await service.search(searchDto);

      expect(mockElasticsearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { category: 'Technology' } },
                { term: { type: VideoType.VIDEO_PODCAST } },
                { term: { language: VideoLanguage.ARABIC } },
              ]),
            }),
          }),
        }),
      );
    });

    it('should handle search errors gracefully', async () => {
      mockElasticsearchService.search.mockRejectedValue(new Error('ES error'));

      const result = await service.search({ page: 1, limit: 20 });

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should calculate pagination correctly', async () => {
      const searchDto: SearchVideosDto = { page: 2, limit: 10 };
      mockElasticsearchService.search.mockResolvedValue({
        hits: { total: { value: 25 }, hits: [] },
      });

      const result = await service.search(searchDto);

      expect(result.totalPages).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });
  });

  describe('indexVideo', () => {
    it('should index a video', async () => {
      const video = createMockVideo();
      mockElasticsearchService.index.mockResolvedValue({});
      mockElasticsearchService.indices.refresh.mockResolvedValue({});

      await service.indexVideo(video);

      expect(mockElasticsearchService.index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'test-videos',
          id: video.id,
          document: expect.objectContaining({
            id: video.id,
            title: video.title,
          }),
        }),
      );
    });

    it('should not index video without ID', async () => {
      const video = { title: 'No ID' } as Partial<Video>;

      await service.indexVideo(video);

      expect(mockElasticsearchService.index).not.toHaveBeenCalled();
    });
  });

  describe('removeVideo', () => {
    it('should remove a video from index', async () => {
      mockElasticsearchService.delete.mockResolvedValue({});

      await service.removeVideo('test-uuid-1');

      expect(mockElasticsearchService.delete).toHaveBeenCalledWith({
        index: 'test-videos',
        id: 'test-uuid-1',
      });
    });
  });
});
