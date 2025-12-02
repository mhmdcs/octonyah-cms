import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoPlatform } from '@octonyah/shared-videos';
import { PlatformProvider } from '../types/platform-provider.interface';
import { VideoMetadata } from '../types/video-metadata.interface';
import { parseIso8601DurationToSeconds } from '../utils/iso8601-duration.util';

/**
 * YouTube video API response structure (partial, only what we need)
 */
interface YouTubeVideoResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      description: string;
      publishedAt: string;
      channelId: string;
      channelTitle: string;
      tags?: string[];
      thumbnails: {
        default?: { url: string; width: number; height: number };
        medium?: { url: string; width: number; height: number };
        high?: { url: string; width: number; height: number };
        standard?: { url: string; width: number; height: number };
        maxres?: { url: string; width: number; height: number };
      };
    };
    contentDetails: {
      duration: string; // ISO 8601 format (PT1H2M30S)
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
    };
  }>;
}

@Injectable()
export class YouTubeProvider implements PlatformProvider {
  private readonly logger = new Logger(YouTubeProvider.name);
  private readonly apiKey: string;
  private readonly baseApiUrl = 'https://www.googleapis.com/youtube/v3';

  readonly platform = VideoPlatform.YOUTUBE;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('YOUTUBE_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn(
        'YOUTUBE_API_KEY not configured. YouTube imports will fail.',
      );
    }
  }

  /**
   * Checks if the given URL is a YouTube video URL
   * Supports various YouTube URL formats:
   * - https://www.youtube.com/watch?v=VIDEO_ID
   * - https://youtu.be/VIDEO_ID
   * - https://www.youtube.com/embed/VIDEO_ID
   * - https://www.youtube.com/v/VIDEO_ID
   * - https://youtube.com/shorts/VIDEO_ID
   */
  canHandle(url: string): boolean {
    return this.extractVideoId(url) !== null;
  }

  /**
   * Extracts YouTube video ID from various URL formats
   */
  extractVideoId(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Remove whitespace and normalize
    url = url.trim();

    // Patterns for different YouTube URL formats
    const patterns = [
      // Standard watch URL: youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
      // Short URL: youtu.be/VIDEO_ID
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      // Embed URL: youtube.com/embed/VIDEO_ID
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      // Old embed URL: youtube.com/v/VIDEO_ID
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      // Shorts URL: youtube.com/shorts/VIDEO_ID
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      // Just the video ID (11 chars)
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Fetches video metadata from YouTube Data API v3
   */
  async fetchMetadata(videoId: string): Promise<VideoMetadata> {
    if (!this.apiKey) {
      throw new BadRequestException(
        'YouTube API key not configured. Please set YOUTUBE_API_KEY environment variable.',
      );
    }

    const url = new URL(`${this.baseApiUrl}/videos`);
    url.searchParams.set('id', videoId);
    url.searchParams.set('part', 'snippet,contentDetails,statistics');
    url.searchParams.set('key', this.apiKey);

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(
          `YouTube API error: ${response.status} - ${errorBody}`,
        );
        throw new BadRequestException(
          `Failed to fetch video from YouTube: ${response.status}`,
        );
      }

      const data: YouTubeVideoResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new BadRequestException(
          `Video not found on YouTube: ${videoId}`,
        );
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const thumbnails = snippet.thumbnails;

      // Get best available thumbnail (prefer higher resolution)
      const thumbnailUrl =
        thumbnails.maxres?.url ||
        thumbnails.standard?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        this.getThumbnailUrl(videoId);

      return {
        platform: VideoPlatform.YOUTUBE,
        platformVideoId: videoId,
        title: snippet.title,
        description: snippet.description || undefined,
        durationSeconds: parseIso8601DurationToSeconds(
          video.contentDetails.duration,
        ),
        thumbnailUrl,
        embedUrl: this.getEmbedUrl(videoId),
        originalUrl: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: new Date(snippet.publishedAt),
        channelName: snippet.channelTitle,
        channelId: snippet.channelId,
        tags: snippet.tags,
        viewCount: video.statistics?.viewCount
          ? parseInt(video.statistics.viewCount, 10)
          : undefined,
        likeCount: video.statistics?.likeCount
          ? parseInt(video.statistics.likeCount, 10)
          : undefined,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to fetch YouTube video metadata: ${error}`);
      throw new BadRequestException(
        `Failed to fetch video metadata from YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Generate YouTube embed URL
   */
  getEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  /**
   * Get YouTube thumbnail URL (maxresdefault or hqdefault)
   */
  getThumbnailUrl(videoId: string): string {
    // maxresdefault is the highest quality but may not exist for all videos
    // We use hqdefault as a reliable fallback
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
}

