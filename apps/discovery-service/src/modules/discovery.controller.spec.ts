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

// Mock the services
jest.mock('./discovery.service');
jest.mock('../search/video-search.service', () => ({
  VideoSearchService: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Video, VideoType, VideoLanguage, VideoPlatform } from '@octonyah/shared-videos';
import { SearchVideosDto } from './dto/search-videos.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

describe('DiscoveryController', () => {
  let controller: DiscoveryController;
  let discoveryService: DiscoveryService;

  const mockDiscoveryService = {
    searchVideos: jest.fn(),
    getVideo: jest.fn(),
    getVideosByCategory: jest.fn(),
    getVideosByType: jest.fn(),
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

  const createMockSearchResponse = (): SearchResponseDto => ({
    data: [createMockVideo()],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscoveryController],
      providers: [
        { provide: DiscoveryService, useValue: mockDiscoveryService },
      ],
    }).compile();

    controller = module.get<DiscoveryController>(DiscoveryController);
    discoveryService = module.get<DiscoveryService>(DiscoveryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should return search results', async () => {
      const searchDto: SearchVideosDto = { q: 'test', page: 1, limit: 20 };
      const searchResponse = createMockSearchResponse();

      mockDiscoveryService.searchVideos.mockResolvedValue(searchResponse);

      const result = await controller.search(searchDto);

      expect(result).toEqual(searchResponse);
      expect(mockDiscoveryService.searchVideos).toHaveBeenCalledWith(searchDto);
    });

    it('should handle search with filters', async () => {
      const searchDto: SearchVideosDto = {
        q: 'test',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
        language: VideoLanguage.ARABIC,
        page: 1,
        limit: 10,
      };
      const searchResponse = createMockSearchResponse();

      mockDiscoveryService.searchVideos.mockResolvedValue(searchResponse);

      const result = await controller.search(searchDto);

      expect(result).toEqual(searchResponse);
      expect(mockDiscoveryService.searchVideos).toHaveBeenCalledWith(searchDto);
    });
  });

  describe('getVideo', () => {
    it('should return a video by ID', async () => {
      const video = createMockVideo();
      mockDiscoveryService.getVideo.mockResolvedValue(video);

      const result = await controller.getVideo('test-uuid-1');

      expect(result).toEqual(video);
      expect(mockDiscoveryService.getVideo).toHaveBeenCalledWith('test-uuid-1');
    });

    it('should throw HttpException when video not found', async () => {
      mockDiscoveryService.getVideo.mockRejectedValue(new Error('Video not found'));

      await expect(controller.getVideo('non-existent')).rejects.toThrow(HttpException);
    });

    it('should rethrow HttpException as-is', async () => {
      const httpError = new HttpException('Custom error', HttpStatus.BAD_REQUEST);
      mockDiscoveryService.getVideo.mockRejectedValue(httpError);

      await expect(controller.getVideo('test')).rejects.toThrow(httpError);
    });
  });

  describe('getByCategory', () => {
    it('should return videos by category', async () => {
      const searchResponse = createMockSearchResponse();
      mockDiscoveryService.getVideosByCategory.mockResolvedValue(searchResponse);

      const result = await controller.getByCategory('Technology', 1, 20);

      expect(result).toEqual(searchResponse);
      expect(mockDiscoveryService.getVideosByCategory).toHaveBeenCalledWith(
        'Technology',
        1,
        20,
      );
    });

    it('should handle undefined pagination params', async () => {
      const searchResponse = createMockSearchResponse();
      mockDiscoveryService.getVideosByCategory.mockResolvedValue(searchResponse);

      await controller.getByCategory('Technology', undefined, undefined);

      expect(mockDiscoveryService.getVideosByCategory).toHaveBeenCalledWith(
        'Technology',
        undefined,
        undefined,
      );
    });
  });

  describe('getByType', () => {
    it('should return videos by type', async () => {
      const searchResponse = createMockSearchResponse();
      mockDiscoveryService.getVideosByType.mockResolvedValue(searchResponse);

      const result = await controller.getByType('video_podcast', 1, 20);

      expect(result).toEqual(searchResponse);
      expect(mockDiscoveryService.getVideosByType).toHaveBeenCalledWith(
        'video_podcast',
        1,
        20,
      );
    });
  });
});
