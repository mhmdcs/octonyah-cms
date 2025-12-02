import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PLATFORM_PROVIDERS } from './types/platform-provider.interface';
import { YouTubeProvider } from './providers/youtube.provider';
import { VideoPlatformsService } from './video-platforms.service';

@Module({
  imports: [ConfigModule],
  providers: [
    YouTubeProvider,
    {
      provide: PLATFORM_PROVIDERS,
      useFactory: (youtubeProvider: YouTubeProvider) => {
        // Add more providers here as they are implemented
        return [youtubeProvider];
      },
      inject: [YouTubeProvider],
    },
    VideoPlatformsService,
  ],
  exports: [VideoPlatformsService, YouTubeProvider],
})
export class VideoPlatformsModule {}

