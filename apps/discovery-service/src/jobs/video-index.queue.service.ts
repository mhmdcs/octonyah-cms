import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  VIDEO_INDEX_QUEUE,
  INDEX_VIDEO_JOB,
  REINDEX_ALL_JOB,
  REMOVE_VIDEO_JOB,
} from './video-index.queue';

@Injectable()
export class VideoIndexQueueService {
  constructor(
    @InjectQueue(VIDEO_INDEX_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueVideo(videoId?: string) {
    if (!videoId) return;
    await this.queue.add(INDEX_VIDEO_JOB, { videoId }, {
      removeOnComplete: 50,
      removeOnFail: 50,
    });
  }

  async enqueueFullReindex() {
    await this.queue.add(REINDEX_ALL_JOB,{},
      {
        removeOnComplete: false,
        removeOnFail: false,
      },
    );
  }

  async enqueueRemoval(videoId?: string) {
    if (!videoId) return;
    await this.queue.add(REMOVE_VIDEO_JOB, { videoId }, {
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    );
  }
}
