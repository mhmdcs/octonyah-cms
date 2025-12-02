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

  async process(job: Job<{ videoId?: string }>): Promise<void> {
    const handlers: Record<string, () => Promise<void>> = {
      [INDEX_VIDEO_JOB]: () => this.handleIndexVideo(job.data.videoId),
      [REINDEX_ALL_JOB]: () => this.handleReindexAll(),
      [REMOVE_VIDEO_JOB]: () => this.handleRemoval(job.data.videoId),
    };
    await handlers[job.name]?.();
  }

  private async handleIndexVideo(videoId?: string) {
    if (!videoId) return;
    const video = await this.videoRepository.findOne({ where: { id: videoId }, withDeleted: true });
    if (!video) return;
    // If video is soft-deleted, remove from ES instead of indexing
    video.deletedAt ? await this.videoSearch.removeVideo(videoId) : await this.videoSearch.indexVideo(video);
  }

  private async handleReindexAll() {
    // TypeORM automatically excludes soft-deleted videos
    const videos = await this.videoRepository.find({ order: { publicationDate: 'ASC' } });
    for (const video of videos) await this.videoSearch.indexVideo(video);
  }

  private async handleRemoval(videoId?: string) {
    if (videoId) await this.videoSearch.removeVideo(videoId);
  }
}
