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

  private sanitizeVideo(video: Partial<Video>) {
    const { publicationDate, createdAt, updatedAt, ...rest } = video;
    return {
      ...rest, tags: video.tags ?? [], popularityScore: video.popularityScore ?? 0,
      publicationDate: this.sanitizeDate(publicationDate),
      createdAt: this.sanitizeDate(createdAt), updatedAt: this.sanitizeDate(updatedAt),
    };
  }
}

