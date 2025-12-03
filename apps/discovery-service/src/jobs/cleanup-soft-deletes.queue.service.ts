import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { JobsOptions, Queue } from 'bullmq';
import { CLEANUP_QUEUE, CLEANUP_SOFT_DELETES_JOB } from './cleanup-soft-deletes.queue';

const CLEANUP_JOB_OPTIONS: JobsOptions = {
  removeOnComplete: 10,
  removeOnFail: 50,
};

@Injectable()
export class CleanupSoftDeletesQueueService implements OnModuleInit {
  private readonly logger = new Logger(CleanupSoftDeletesQueueService.name);

  constructor(
    @InjectQueue(CLEANUP_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.scheduleRecurringCleanup();
  }

  // Manually trigger cleanup job (useful for testing or manual runs)
  async triggerCleanup(): Promise<void> {
    await this.queue.add(CLEANUP_SOFT_DELETES_JOB, {}, CLEANUP_JOB_OPTIONS);
    this.logger.log('Manually triggered cleanup job');
  }

  private async scheduleRecurringCleanup(): Promise<void> {
    await this.queue.add(CLEANUP_SOFT_DELETES_JOB, {}, {
      ...CLEANUP_JOB_OPTIONS,
      repeat: { pattern: '0 2 * * *' }, // Daily at 2 AM
      jobId: CLEANUP_SOFT_DELETES_JOB,  // Unique ID to prevent duplicates
    });
    this.logger.log('Scheduled daily cleanup job for soft-deleted videos (runs at 2 AM)');
  }
}

