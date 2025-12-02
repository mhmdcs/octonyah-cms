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

    // Include soft-deleted videos to check their status
    const video = await this.videoRepository.findOne({
      where: { id: videoId },
      withDeleted: true,
    });
    if (!video) {
      return;
    }

    // If video is soft-deleted, remove it from Elasticsearch instead of indexing
    if (video.deletedAt) {
      await this.videoSearch.removeVideo(videoId);
      return;
    }

    await this.videoSearch.indexVideo(video);
  }

  private async handleReindexAll() {
    // Only index non-deleted videos (TypeORM automatically excludes soft-deleted)
    const videos = await this.videoRepository.find({
      order: { publicationDate: 'ASC' },
    });

    for (const video of videos) {
      // Only index videos that are not soft-deleted
      if (!video.deletedAt) {
        await this.videoSearch.indexVideo(video);
      }
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
