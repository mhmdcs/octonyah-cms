import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  PROGRAM_INDEX_QUEUE,
  INDEX_PROGRAM_JOB,
  REINDEX_ALL_JOB,
  REMOVE_PROGRAM_JOB,
} from './program-index.queue';

@Injectable()
export class ProgramIndexQueueService {
  constructor(
    @InjectQueue(PROGRAM_INDEX_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueProgram(programId?: string) {
    if (!programId) return;
    await this.queue.add(INDEX_PROGRAM_JOB, { programId }, {
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

  async enqueueRemoval(programId?: string) {
    if (!programId) return;
    await this.queue.add(REMOVE_PROGRAM_JOB, { programId }, {
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    );
  }
}
