import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { Video } from '@octonyah/shared-videos';
import {
  INDEX_VIDEO_JOB,
  VIDEO_INDEX_QUEUE,
  REINDEX_ALL_JOB,
  REMOVE_VIDEO_JOB,
} from './video-index.queue';
import { VideoSearchService } from '../search/video-search.service';

@Processor(VIDEO_INDEX_QUEUE)
export class VideoIndexProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly videoSearch: VideoSearchService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    switch (job.name) {
      case INDEX_VIDEO_JOB:
        await this.handleIndexVideo(job as Job<{ videoId: string }>);
        break;
      case REINDEX_ALL_JOB:
        await this.handleReindexAll();
        break;
      case REMOVE_VIDEO_JOB:
        await this.handleRemoval(job as Job<{ videoId: string }>);
        break;
      default:
        return;
    }
  }

  private async handleIndexVideo(job: Job<{ videoId: string }>) {
    const { videoId } = job.data;
    if (!videoId) {
      return;
    }

    const video = await this.videoRepository.findOne({
      where: { id: videoId },
    });
    if (!video) {
      return;
    }

    await this.videoSearch.indexVideo(video);
  }

  private async handleReindexAll() {
    const videos = await this.videoRepository.find({
      order: { publicationDate: 'ASC' },
    });

    for (const video of videos) {
      await this.videoSearch.indexVideo(video);
    }
  }

  private async handleRemoval(job: Job<{ videoId: string }>) {
    const { videoId } = job.data;
    if (!videoId) {
      return;
    }

    await this.videoSearch.removeVideo(videoId);
  }
}
