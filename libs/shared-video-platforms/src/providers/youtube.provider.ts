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
    if (!url || typeof url !== 'string') return null;
    const patterns = [
      /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.trim().match(pattern);
      if (match?.[1]) return match[1];
    }
    return null;
  }

  async fetchMetadata(videoId: string): Promise<VideoMetadata> {
    if (!this.apiKey) throw new BadRequestException('YouTube API key not configured. Please set YOUTUBE_API_KEY environment variable.');

    try {
      const data = await this.fetchFromApi(videoId);
      if (!data.items?.length) throw new BadRequestException(`Video not found on YouTube: ${videoId}`);
      return this.buildMetadata(videoId, data.items[0]);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(`Failed to fetch YouTube video metadata: ${error}`);
      throw new BadRequestException(`Failed to fetch video metadata from YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchFromApi(videoId: string): Promise<YouTubeVideoResponse> {
    const url = new URL(`${this.baseApiUrl}/videos`);
    url.searchParams.set('id', videoId);
    url.searchParams.set('part', 'snippet,contentDetails,statistics');
    url.searchParams.set('key', this.apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      this.logger.error(`YouTube API error: ${response.status} - ${await response.text()}`);
      throw new BadRequestException(`Failed to fetch video from YouTube: ${response.status}`);
    }
    return response.json();
  }

  private buildMetadata(videoId: string, video: YouTubeVideoResponse['items'][0]): VideoMetadata {
    const { snippet, contentDetails, statistics } = video;
    return {
      platform: VideoPlatform.YOUTUBE,
      platformVideoId: videoId,
      title: snippet.title,
      description: snippet.description || undefined,
      durationSeconds: parseIso8601DurationToSeconds(contentDetails.duration),
      thumbnailUrl: this.getBestThumbnail(snippet.thumbnails, videoId),
      embedUrl: this.getEmbedUrl(videoId),
      originalUrl: `https://www.youtube.com/watch?v=${videoId}`,
      publishedAt: new Date(snippet.publishedAt),
      channelName: snippet.channelTitle,
      channelId: snippet.channelId,
      tags: snippet.tags,
      viewCount: statistics?.viewCount ? parseInt(statistics.viewCount, 10) : undefined,
      likeCount: statistics?.likeCount ? parseInt(statistics.likeCount, 10) : undefined,
    };
  }

  private getBestThumbnail(thumbnails: YouTubeVideoResponse['items'][0]['snippet']['thumbnails'], videoId: string): string {
    return thumbnails.maxres?.url || thumbnails.standard?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || this.getThumbnailUrl(videoId);
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

