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
    if (job.name !== CLEANUP_SOFT_DELETES_JOB) {
      return;
    }

    await this.cleanupOldSoftDeletes();
  }

  /**
   * Permanently deletes videos that were soft-deleted more than 90 days ago
   */
  private async cleanupOldSoftDeletes(): Promise<void> {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    this.logger.log(
      `Starting cleanup of soft-deleted videos older than ${ninetyDaysAgo.toISOString()}`,
    );

    try {
      // Find all videos that were soft-deleted more than 90 days ago
      // Need to use withDeleted() to include soft-deleted records
      const softDeletedVideos = await this.videoRepository
        .createQueryBuilder('video')
        .withDeleted() // Include soft-deleted records
        .where('video.deletedAt IS NOT NULL')
        .andWhere('video.deletedAt < :cutoffDate', {
          cutoffDate: ninetyDaysAgo,
        })
        .getMany();

      if (softDeletedVideos.length === 0) {
        this.logger.log('No old soft-deleted videos found to clean up');
        return;
      }

      this.logger.log(
        `Found ${softDeletedVideos.length} videos to permanently delete`,
      );

      const videoIds = softDeletedVideos.map((v) => v.id);

      // Remove from Elasticsearch first
      for (const videoId of videoIds) {
        try {
          await this.videoSearch.removeVideo(videoId);
        } catch (error) {
          this.logger.warn(
            `Failed to remove video ${videoId} from Elasticsearch: ${error}`,
          );
          // Continue with deletion even if ES removal fails
        }
      }

      // Permanently delete from database
      // Use raw delete query to bypass TypeORM soft delete protection
      await this.videoRepository
        .createQueryBuilder()
        .delete()
        .where('id IN (:...ids)', { ids: videoIds })
        .execute();

      this.logger.log(
        `Successfully permanently deleted ${videoIds.length} videos`,
      );
    } catch (error) {
      this.logger.error('Failed to cleanup old soft-deleted videos', error);
      throw error;
    }
  }
}

