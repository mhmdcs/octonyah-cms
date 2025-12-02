import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventPublisherService } from './event-publisher.service';
import {
  Video,
  VideoEventPattern,
  VideoEventMessage,
} from '@octonyah/shared-videos';

export const VIDEO_EVENTS_CLIENT = 'VIDEO_EVENTS_CLIENT';

@Injectable()
export class VideoEventsPublisher extends EventPublisherService {
  constructor(
    @Inject(VIDEO_EVENTS_CLIENT)
    client: ClientProxy,
  ) {
    super(client);
  }

  videoCreated(video: Video): void {
    this.emitEvent(VideoEventPattern.VideoCreated, {
      video: this.sanitizeVideo(video),
    });
  }

  videoUpdated(video: Video): void {
    this.emitEvent(VideoEventPattern.VideoUpdated, {
      video: this.sanitizeVideo(video),
    });
  }

  videoDeleted(video: Pick<Video, 'id'>): void {
    this.emitEvent(VideoEventPattern.VideoDeleted, {
      video: this.sanitizeVideo(video),
    });
  }

  private sanitizeVideo(video: Partial<Video>): VideoEventMessage<Record<string, unknown>>['video'] {
    return {
      ...video,
      tags: video.tags ?? [],
      popularityScore: video.popularityScore ?? 0,
      publicationDate: this.sanitizeDate(video.publicationDate),
      createdAt: this.sanitizeDate(video.createdAt),
      updatedAt: this.sanitizeDate(video.updatedAt),
    } as Record<string, unknown>;
  }
}

