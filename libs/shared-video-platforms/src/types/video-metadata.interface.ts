import { VideoPlatform } from '@octonyah/shared-videos';

/**
 * Standardized video metadata extracted from any platform.
 * Used as a common interface across all video platform providers.
 */
export interface VideoMetadata {
  /** Platform identifier (youtube, native, etc.) */
  platform: VideoPlatform;

  /** Video ID on the external platform */
  platformVideoId: string;

  /** Video title */
  title: string;

  /** Video description (may be null/empty) */
  description?: string;

  /** Duration in seconds */
  durationSeconds: number;

  /** URL to the highest quality thumbnail available */
  thumbnailUrl: string;

  /** Embeddable URL for the video player */
  embedUrl: string;

  /** Original video URL on the platform */
  originalUrl: string;

  /** Publication date on the platform */
  publishedAt: Date;

  /** Channel/uploader name */
  channelName?: string;

  /** Channel/uploader ID */
  channelId?: string;

  /** Tags/keywords from the platform */
  tags?: string[];

  /** View count (if available) */
  viewCount?: number;

  /** Like count (if available) */
  likeCount?: number;
}

/**
 * Result of platform URL detection
 */
export interface PlatformDetectionResult {
  platform: VideoPlatform;
  videoId: string;
}

