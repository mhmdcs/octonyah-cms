import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Video } from '@octonyah/shared-videos';
import { CLEANUP_SOFT_DELETES_JOB } from './cleanup-soft-deletes.queue';
import { VideoSearchService } from '../search/video-search.service';

@Processor('cleanup-soft-deletes')
export class CleanupSoftDeletesProcessor extends WorkerHost {
  private readonly logger = new Logger(CleanupSoftDeletesProcessor.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly videoSearch: VideoSearchService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === CLEANUP_SOFT_DELETES_JOB) await this.cleanupOldSoftDeletes();
  }

  private async cleanupOldSoftDeletes(): Promise<void> {
    const cutoffDate = this.getCutoffDate(90);
    this.logger.log(`Starting cleanup of soft-deleted videos older than ${cutoffDate.toISOString()}`);

    try {
      const videos = await this.findExpiredSoftDeletes(cutoffDate);
      if (!videos.length) {
        this.logger.log('No old soft-deleted videos found to clean up');
        return;
      }

      this.logger.log(`Found ${videos.length} videos to permanently delete`);
      const ids = videos.map((v) => v.id);
      await this.removeFromSearchIndex(ids);
      await this.permanentlyDeleteFromDb(ids);
      this.logger.log(`Successfully permanently deleted ${ids.length} videos`);
    } catch (error) {
      this.logger.error('Failed to cleanup old soft-deleted videos', error);
      throw error;
    }
  }

  private getCutoffDate(daysAgo: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  private async findExpiredSoftDeletes(cutoffDate: Date): Promise<Video[]> {
    return this.videoRepository
      .createQueryBuilder('video')
      .withDeleted()
      .where('video.deletedAt IS NOT NULL')
      .andWhere('video.deletedAt < :cutoffDate', { cutoffDate })
      .getMany();
  }

  private async removeFromSearchIndex(ids: string[]): Promise<void> {
    for (const id of ids) {
      try {
        await this.videoSearch.removeVideo(id);
      } catch (error) {
        this.logger.warn(`Failed to remove video ${id} from Elasticsearch: ${error}`);
      }
    }
  }

  private async permanentlyDeleteFromDb(ids: string[]): Promise<void> {
    await this.videoRepository.createQueryBuilder().delete().where('id IN (:...ids)', { ids }).execute();
  }
}

