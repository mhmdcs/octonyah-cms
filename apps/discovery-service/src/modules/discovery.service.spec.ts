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

// Mock @nestjs/elasticsearch
jest.mock('@nestjs/elasticsearch', () => ({
  ElasticsearchService: jest.fn(),
  ElasticsearchModule: {
    registerAsync: jest.fn().mockReturnValue({ module: class {} }),
  },
}));

// Mock the VideoSearchService
jest.mock('../search/video-search.service', () => ({
  VideoSearchService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoType, VideoPlatform } from '@octonyah/shared-videos';
import { RedisCacheService } from '@octonyah/shared-cache';
import { SearchVideosDto } from './dto/search-videos.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { DiscoveryService } from './discovery.service';
import { VideoSearchService } from '../search/video-search.service';

describe('DiscoveryService', () => {
  let service: DiscoveryService;
  let videoRepository: Repository<Video>;
  let cacheService: RedisCacheService;
  let videoSearchService: VideoSearchService;

  const mockVideoRepository = {
    findOne: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deleteByPrefix: jest.fn(),
  };

  const mockVideoSearchService = {
    search: jest.fn(),
  };

  const createMockVideo = (overrides: Partial<Video> = {}): Video => ({
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
    ...overrides,
  } as Video);

  const createMockSearchResponse = (overrides: Partial<SearchResponseDto> = {}): SearchResponseDto => ({
    data: [createMockVideo()],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscoveryService,
        { provide: getRepositoryToken(Video), useValue: mockVideoRepository },
        { provide: RedisCacheService, useValue: mockCacheService },
        { provide: VideoSearchService, useValue: mockVideoSearchService },
      ],
    }).compile();

    service = module.get<DiscoveryService>(DiscoveryService);
    videoRepository = module.get<Repository<Video>>(getRepositoryToken(Video));
    cacheService = module.get<RedisCacheService>(RedisCacheService);
    videoSearchService = module.get<VideoSearchService>(VideoSearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchVideos', () => {
    it('should return search results from cache if available', async () => {
      const searchDto: SearchVideosDto = { q: 'test', page: 1, limit: 20 };
      const cachedResponse = createMockSearchResponse();

      mockCacheService.get.mockResolvedValue(cachedResponse);

      const result = await service.searchVideos(searchDto);

      expect(result).toEqual(cachedResponse);
      expect(mockCacheService.get).toHaveBeenCalled();
      expect(mockVideoSearchService.search).not.toHaveBeenCalled();
    });

    it('should search and cache results if not in cache', async () => {
      const searchDto: SearchVideosDto = { q: 'test', page: 1, limit: 20 };
      const searchResponse = createMockSearchResponse();

      mockCacheService.get.mockResolvedValue(null);
      mockVideoSearchService.search.mockResolvedValue(searchResponse);

      const result = await service.searchVideos(searchDto);

      expect(result).toEqual(searchResponse);
      expect(mockVideoSearchService.search).toHaveBeenCalledWith(searchDto);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should build correct cache key for search', async () => {
      const searchDto: SearchVideosDto = {
        q: 'test query',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
        page: 1,
        limit: 20,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockVideoSearchService.search.mockResolvedValue(createMockSearchResponse());

      await service.searchVideos(searchDto);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        expect.stringContaining('discovery:search:'),
      );
    });
  });

  describe('getVideo', () => {
    it('should return video from cache if available', async () => {
      const video = createMockVideo();
      mockCacheService.get.mockResolvedValue(video);

      const result = await service.getVideo('test-uuid-1');

      expect(result).toEqual(video);
      expect(mockVideoRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch and cache video if not in cache', async () => {
      const video = createMockVideo();
      mockCacheService.get.mockResolvedValue(null);
      mockVideoRepository.findOne.mockResolvedValue(video);

      const result = await service.getVideo('test-uuid-1');

      expect(result).toEqual(video);
      expect(mockVideoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-uuid-1' },
      });
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should throw error when video not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockVideoRepository.findOne.mockResolvedValue(null);

      await expect(service.getVideo('non-existent')).rejects.toThrow(
        'Video with ID non-existent not found',
      );
    });
  });

  describe('getVideosByCategory', () => {
    it('should call searchVideos with category filter', async () => {
      const searchResponse = createMockSearchResponse();
      mockCacheService.get.mockResolvedValue(null);
      mockVideoSearchService.search.mockResolvedValue(searchResponse);

      const result = await service.getVideosByCategory('Technology', 1, 20);

      expect(result).toEqual(searchResponse);
      expect(mockVideoSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Technology' }),
      );
    });

    it('should use default pagination values', async () => {
      const searchResponse = createMockSearchResponse();
      mockCacheService.get.mockResolvedValue(null);
      mockVideoSearchService.search.mockResolvedValue(searchResponse);

      await service.getVideosByCategory('Technology');

      expect(mockVideoSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
    });
  });

  describe('getVideosByType', () => {
    it('should call searchVideos with type filter', async () => {
      const searchResponse = createMockSearchResponse();
      mockCacheService.get.mockResolvedValue(null);
      mockVideoSearchService.search.mockResolvedValue(searchResponse);

      const result = await service.getVideosByType('video_podcast', 1, 20);

      expect(result).toEqual(searchResponse);
      expect(mockVideoSearchService.search).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'video_podcast' }),
      );
    });
  });
});
