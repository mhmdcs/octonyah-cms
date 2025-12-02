import { VideoPlatform } from '@octonyah/shared-videos';
import { VideoMetadata } from './video-metadata.interface';

/**
 * Interface for video platform providers.
 * Each platform (YouTube, Vimeo, etc.) implements this interface.
 */
export interface PlatformProvider {
  /** The platform this provider handles */
  readonly platform: VideoPlatform;

  /**
   * Check if this provider can handle the given URL
   * @param url - URL to check
   * @returns true if this provider can handle the URL
   */
  canHandle(url: string): boolean;

  /**
   * Extract video ID from URL
   * @param url - Platform video URL
   * @returns Video ID or null if invalid
   */
  extractVideoId(url: string): string | null;

  /**
   * Fetch video metadata from the platform API
   * @param videoId - Platform-specific video ID
   * @returns Video metadata
   */
  fetchMetadata(videoId: string): Promise<VideoMetadata>;

  /**
   * Generate embed URL for the video
   * @param videoId - Platform-specific video ID
   * @returns Embeddable URL
   */
  getEmbedUrl(videoId: string): string;

  /**
   * Get the highest quality thumbnail URL
   * @param videoId - Platform-specific video ID
   * @returns Thumbnail URL
   */
  getThumbnailUrl(videoId: string): string;
}

/**
 * Token for injecting all platform providers
 */
export const PLATFORM_PROVIDERS = 'PLATFORM_PROVIDERS';

