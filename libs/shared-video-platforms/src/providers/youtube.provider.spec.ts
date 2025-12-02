import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { YouTubeProvider } from './youtube.provider';
import { VideoPlatform } from '@octonyah/shared-videos';

// Mock global fetch
global.fetch = jest.fn();

describe('YouTubeProvider', () => {
  let provider: YouTubeProvider;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        YOUTUBE_API_KEY: 'test-api-key',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YouTubeProvider,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    provider = module.get<YouTubeProvider>(YouTubeProvider);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('platform', () => {
    it('should return YOUTUBE platform', () => {
      expect(provider.platform).toBe(VideoPlatform.YOUTUBE);
    });
  });

  describe('extractVideoId', () => {
    it('should extract video ID from standard YouTube URL', () => {
      expect(
        provider.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from youtu.be short URL', () => {
      expect(provider.extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ',
      );
    });

    it('should extract video ID from embed URL', () => {
      expect(
        provider.extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from /v/ URL', () => {
      expect(
        provider.extractVideoId('https://www.youtube.com/v/dQw4w9WgXcQ'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from shorts URL', () => {
      expect(
        provider.extractVideoId('https://youtube.com/shorts/dQw4w9WgXcQ'),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should extract bare video ID', () => {
      expect(provider.extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should handle URL with additional parameters', () => {
      expect(
        provider.extractVideoId(
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
        ),
      ).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URL', () => {
      expect(provider.extractVideoId('https://vimeo.com/123456')).toBeNull();
      expect(provider.extractVideoId('')).toBeNull();
    });

    it('should return null for non-youtube url patterns', () => {
      // Note: 'invalid-url' is 11 chars so it matches the bare video ID pattern
      // Test with a string that's definitely not a valid video ID
      expect(provider.extractVideoId('too-short')).toBeNull();
      expect(provider.extractVideoId('this-is-way-too-long-to-be-a-video-id')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(provider.extractVideoId(null as any)).toBeNull();
      expect(provider.extractVideoId(undefined as any)).toBeNull();
    });

    it('should handle URLs with whitespace', () => {
      expect(
        provider.extractVideoId('  https://youtu.be/dQw4w9WgXcQ  '),
      ).toBe('dQw4w9WgXcQ');
    });
  });

  describe('canHandle', () => {
    it('should return true for YouTube URLs', () => {
      expect(
        provider.canHandle('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      ).toBe(true);
      expect(provider.canHandle('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should return false for non-YouTube URLs', () => {
      expect(provider.canHandle('https://vimeo.com/123456')).toBe(false);
      expect(provider.canHandle('invalid')).toBe(false);
    });
  });

  describe('fetchMetadata', () => {
    const mockApiResponse = {
      items: [
        {
          id: 'dQw4w9WgXcQ',
          snippet: {
            title: 'Test Video',
            description: 'Test Description',
            publishedAt: '2024-01-01T00:00:00Z',
            channelId: 'UCtest',
            channelTitle: 'Test Channel',
            tags: ['music', 'video'],
            thumbnails: {
              maxres: { url: 'https://example.com/maxres.jpg' },
              high: { url: 'https://example.com/high.jpg' },
            },
          },
          contentDetails: {
            duration: 'PT3M30S',
          },
          statistics: {
            viewCount: '1000000',
            likeCount: '50000',
          },
        },
      ],
    };

    it('should fetch and parse video metadata', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await provider.fetchMetadata('dQw4w9WgXcQ');

      expect(result).toEqual({
        platform: VideoPlatform.YOUTUBE,
        platformVideoId: 'dQw4w9WgXcQ',
        title: 'Test Video',
        description: 'Test Description',
        durationSeconds: 210,
        thumbnailUrl: 'https://example.com/maxres.jpg',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        publishedAt: new Date('2024-01-01T00:00:00Z'),
        channelName: 'Test Channel',
        channelId: 'UCtest',
        tags: ['music', 'video'],
        viewCount: 1000000,
        likeCount: 50000,
      });
    });

    it('should throw BadRequestException when video not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] }),
      });

      await expect(provider.fetchMetadata('notfound')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when API returns error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('API key invalid'),
      });

      await expect(provider.fetchMetadata('dQw4w9WgXcQ')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when API key not configured', async () => {
      mockConfigService.get.mockReturnValue('');

      const providerWithoutKey = new YouTubeProvider({
        get: () => '',
      } as any);

      await expect(providerWithoutKey.fetchMetadata('dQw4w9WgXcQ')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getEmbedUrl', () => {
    it('should generate correct embed URL', () => {
      expect(provider.getEmbedUrl('dQw4w9WgXcQ')).toBe(
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
      );
    });
  });

  describe('getThumbnailUrl', () => {
    it('should generate correct thumbnail URL', () => {
      expect(provider.getThumbnailUrl('dQw4w9WgXcQ')).toBe(
        'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      );
    });
  });
});

