import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  VideoEventPattern,
  VideoEventMessage,
  Video,
} from '@octonyah/shared-videos';
import { RedisCacheService, SEARCH_CACHE_PREFIX, buildVideoCacheKey } from '@octonyah/shared-cache';
import { EventListenerBase } from '@octonyah/shared-events';
import { VideoIndexQueueService } from '../jobs/video-index.queue.service';

@Controller()
export class VideoEventsListener extends EventListenerBase {
  private readonly logger = new Logger(VideoEventsListener.name);

  constructor(
    private readonly cache: RedisCacheService,
    private readonly videoIndexQueue: VideoIndexQueueService,
  ) {
    super();
  }

  @EventPattern(VideoEventPattern.VideoCreated)
  async handleVideoCreated(
    @Payload() data: VideoEventMessage<Partial<Video>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Video created event received: ${data.video.id}`);
    await this.enqueueIndex(data.video);
    await this.invalidateCache(data.video?.id);
    this.ack(context);
  }

  @EventPattern(VideoEventPattern.VideoUpdated)
  async handleVideoUpdated(
    @Payload() data: VideoEventMessage<Partial<Video>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Video updated event received: ${data.video.id}`);
    await this.enqueueIndex(data.video);
    await this.invalidateCache(data.video?.id);
    this.ack(context);
  }

  @EventPattern(VideoEventPattern.VideoDeleted)
  async handleVideoDeleted(
    @Payload() data: VideoEventMessage<Partial<Video>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Video deleted event received: ${data.video.id}`);
    await this.videoIndexQueue.enqueueRemoval(data.video?.id);
    await this.invalidateCache(data.video?.id);
    this.ack(context);
  }

  @EventPattern(VideoEventPattern.ReindexRequested)
  async handleReindexRequested(@Ctx() context: RmqContext) {
    this.logger.log('Full reindex requested');
    await this.videoIndexQueue.enqueueFullReindex();
    this.ack(context);
  }

  private async invalidateCache(videoId?: string) {
    if (videoId) await this.cache.delete(buildVideoCacheKey(videoId));
    await this.cache.deleteByPrefix(SEARCH_CACHE_PREFIX);
  }

  private enqueueIndex(video?: Partial<Video>) {
    return this.videoIndexQueue.enqueueVideo(video?.id);
  }
}
