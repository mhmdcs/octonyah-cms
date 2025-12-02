import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CLEANUP_QUEUE, CLEANUP_SOFT_DELETES_JOB } from './cleanup-soft-deletes.queue';

@Injectable()
export class CleanupSoftDeletesQueueService implements OnModuleInit {
  private readonly logger = new Logger(CleanupSoftDeletesQueueService.name);

  constructor(
    @InjectQueue(CLEANUP_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    // Schedule recurring job to run daily at 2 AM
    // This checks for videos soft-deleted more than 90 days ago
    await this.queue.add(
      CLEANUP_SOFT_DELETES_JOB,
      {},
      {
        repeat: {
          pattern: '0 2 * * *', // Daily at 2 AM (cron pattern)
        },
        jobId: CLEANUP_SOFT_DELETES_JOB, // Unique ID to prevent duplicates
        removeOnComplete: 10,
        removeOnFail: 50,
      },
    );

    this.logger.log('Scheduled daily cleanup job for soft-deleted videos (runs at 2 AM)');
  }

  /**
   * Manually trigger cleanup job (useful for testing or manual runs)
   */
  async triggerCleanup(): Promise<void> {
    await this.queue.add(CLEANUP_SOFT_DELETES_JOB, {}, {
      removeOnComplete: 10,
      removeOnFail: 50,
    });
    this.logger.log('Manually triggered cleanup job');
  }
}

