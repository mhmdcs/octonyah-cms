import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { VideoPlatform } from '@octonyah/shared-videos';
import {
  PlatformProvider,
  PLATFORM_PROVIDERS,
} from './types/platform-provider.interface';
import {
  VideoMetadata,
  PlatformDetectionResult,
} from './types/video-metadata.interface';

/**
 * Service that orchestrates video platform providers.
 * Auto-detects platform from URL and delegates to appropriate provider.
 */
@Injectable()
export class VideoPlatformsService {
  private readonly logger = new Logger(VideoPlatformsService.name);
  private readonly providerMap: Map<VideoPlatform, PlatformProvider>;

  constructor(
    @Inject(PLATFORM_PROVIDERS)
    private readonly providers: PlatformProvider[],
  ) {
    // Build provider lookup map
    this.providerMap = new Map();
    for (const provider of providers) {
      this.providerMap.set(provider.platform, provider);
      this.logger.log(`Registered platform provider: ${provider.platform}`);
    }
  }

  /**
   * Detect platform and extract video ID from URL
   * @param url - Video URL from any supported platform
   * @returns Platform type and video ID
   * @throws BadRequestException if URL is not from a supported platform
   */
  detectPlatform(url: string): PlatformDetectionResult {
    for (const provider of this.providers) {
      const videoId = provider.extractVideoId(url);
      if (videoId) {
        return {
          platform: provider.platform,
          videoId,
        };
      }
    }

    throw new BadRequestException(
      `Unsupported video URL. Supported platforms: ${Array.from(this.providerMap.keys()).join(', ')}`,
    );
  }

  /**
   * Get provider for a specific platform
   * @param platform - Platform type
   * @returns Platform provider
   * @throws BadRequestException if platform is not supported
   */
  getProvider(platform: VideoPlatform): PlatformProvider {
    const provider = this.providerMap.get(platform);
    if (!provider) {
      throw new BadRequestException(`Platform not supported: ${platform}`);
    }
    return provider;
  }

  /**
   * Fetch video metadata from URL
   * Auto-detects platform and fetches metadata
   * @param url - Video URL from any supported platform
   * @returns Video metadata
   */
  async fetchMetadataFromUrl(url: string): Promise<VideoMetadata> {
    const { platform, videoId } = this.detectPlatform(url);
    const provider = this.getProvider(platform);
    return provider.fetchMetadata(videoId);
  }

  /**
   * Fetch video metadata by platform and video ID
   * @param platform - Platform type
   * @param videoId - Platform-specific video ID
   * @returns Video metadata
   */
  async fetchMetadata(
    platform: VideoPlatform,
    videoId: string,
  ): Promise<VideoMetadata> {
    const provider = this.getProvider(platform);
    return provider.fetchMetadata(videoId);
  }

  /**
   * Get list of supported platforms
   */
  getSupportedPlatforms(): VideoPlatform[] {
    return Array.from(this.providerMap.keys());
  }
}

