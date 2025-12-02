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

  detectPlatform(url: string): PlatformDetectionResult {
    for (const provider of this.providers) {
      const videoId = provider.extractVideoId(url);
      if (videoId) return { platform: provider.platform, videoId };
    }
    throw new BadRequestException(`Unsupported video URL. Supported platforms: ${this.getSupportedPlatforms().join(', ')}`);
  }

  getProvider(platform: VideoPlatform): PlatformProvider {
    const provider = this.providerMap.get(platform);
    if (!provider) throw new BadRequestException(`Platform not supported: ${platform}`);
    return provider;
  }

  async fetchMetadataFromUrl(url: string): Promise<VideoMetadata> {
    const { platform, videoId } = this.detectPlatform(url);
    return this.getProvider(platform).fetchMetadata(videoId);
  }

  async fetchMetadata(platform: VideoPlatform, videoId: string): Promise<VideoMetadata> {
    return this.getProvider(platform).fetchMetadata(videoId);
  }

  getSupportedPlatforms(): VideoPlatform[] {
    return Array.from(this.providerMap.keys());
  }
}

