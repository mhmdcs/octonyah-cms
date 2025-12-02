import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VideoPlatformsService } from './video-platforms.service';
import { PLATFORM_PROVIDERS, PlatformProvider } from './types/platform-provider.interface';
import { VideoPlatform } from '@octonyah/shared-videos';
import { VideoMetadata } from './types/video-metadata.interface';

describe('VideoPlatformsService', () => {
  let service: VideoPlatformsService;

  const mockYouTubeProvider: PlatformProvider = {
    platform: VideoPlatform.YOUTUBE,
    canHandle: jest.fn(),
    extractVideoId: jest.fn(),
    fetchMetadata: jest.fn(),
    getEmbedUrl: jest.fn(),
    getThumbnailUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoPlatformsService,
        { provide: PLATFORM_PROVIDERS, useValue: [mockYouTubeProvider] },
      ],
    }).compile();

    service = module.get<VideoPlatformsService>(VideoPlatformsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectPlatform', () => {
    it('should detect YouTube platform from URL', () => {
      (mockYouTubeProvider.extractVideoId as jest.Mock).mockReturnValue('videoId123');

      const result = service.detectPlatform('https://www.youtube.com/watch?v=videoId123');

      expect(result).toEqual({
        platform: VideoPlatform.YOUTUBE,
        videoId: 'videoId123',
      });
    });

    it('should throw BadRequestException for unsupported URL', () => {
      (mockYouTubeProvider.extractVideoId as jest.Mock).mockReturnValue(null);

      expect(() => service.detectPlatform('https://vimeo.com/123')).toThrow(
        BadRequestException,
      );
    });

    it('should include supported platforms in error message', () => {
      (mockYouTubeProvider.extractVideoId as jest.Mock).mockReturnValue(null);

      try {
        service.detectPlatform('https://invalid.com/video');
      } catch (error) {
        expect(error.message).toContain('Unsupported video URL');
        expect(error.message).toContain('youtube');
      }
    });
  });

  describe('getProvider', () => {
    it('should return correct provider for platform', () => {
      const provider = service.getProvider(VideoPlatform.YOUTUBE);

      expect(provider).toBe(mockYouTubeProvider);
    });

    it('should throw BadRequestException for unsupported platform', () => {
      expect(() =>
        service.getProvider('unsupported' as VideoPlatform),
      ).toThrow(BadRequestException);
    });
  });

  describe('fetchMetadataFromUrl', () => {
    it('should detect platform and fetch metadata', async () => {
      const mockMetadata: VideoMetadata = {
        platform: VideoPlatform.YOUTUBE,
        platformVideoId: 'videoId123',
        title: 'Test Video',
        durationSeconds: 300,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        embedUrl: 'https://youtube.com/embed/videoId123',
        originalUrl: 'https://youtube.com/watch?v=videoId123',
        publishedAt: new Date(),
      };

      (mockYouTubeProvider.extractVideoId as jest.Mock).mockReturnValue('videoId123');
      (mockYouTubeProvider.fetchMetadata as jest.Mock).mockResolvedValue(mockMetadata);

      const result = await service.fetchMetadataFromUrl(
        'https://www.youtube.com/watch?v=videoId123',
      );

      expect(result).toEqual(mockMetadata);
      expect(mockYouTubeProvider.fetchMetadata).toHaveBeenCalledWith('videoId123');
    });
  });

  describe('fetchMetadata', () => {
    it('should fetch metadata from specific platform', async () => {
      const mockMetadata: VideoMetadata = {
        platform: VideoPlatform.YOUTUBE,
        platformVideoId: 'videoId123',
        title: 'Test Video',
        durationSeconds: 300,
        thumbnailUrl: 'https://example.com/thumb.jpg',
        embedUrl: 'https://youtube.com/embed/videoId123',
        originalUrl: 'https://youtube.com/watch?v=videoId123',
        publishedAt: new Date(),
      };

      (mockYouTubeProvider.fetchMetadata as jest.Mock).mockResolvedValue(mockMetadata);

      const result = await service.fetchMetadata(VideoPlatform.YOUTUBE, 'videoId123');

      expect(result).toEqual(mockMetadata);
      expect(mockYouTubeProvider.fetchMetadata).toHaveBeenCalledWith('videoId123');
    });
  });

  describe('getSupportedPlatforms', () => {
    it('should return list of supported platforms', () => {
      const platforms = service.getSupportedPlatforms();

      expect(platforms).toContain(VideoPlatform.YOUTUBE);
      expect(platforms).toHaveLength(1);
    });
  });
});

