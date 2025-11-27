import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { Program } from '@octonyah/shared-programs';
import {
  INDEX_PROGRAM_JOB,
  PROGRAM_INDEX_QUEUE,
  REINDEX_ALL_JOB,
  REMOVE_PROGRAM_JOB,
} from './program-index.queue';
import { ProgramSearchService } from '../search/program-search.service';

@Processor(PROGRAM_INDEX_QUEUE)
export class ProgramIndexProcessor extends WorkerHost {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly programSearch: ProgramSearchService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    switch (job.name) {
      case INDEX_PROGRAM_JOB:
        await this.handleIndexProgram(job as Job<{ programId: string }>);
        break;
      case REINDEX_ALL_JOB:
        await this.handleReindexAll();
        break;
      case REMOVE_PROGRAM_JOB:
        await this.handleRemoval(job as Job<{ programId: string }>);
        break;
      default:
        return;
    }
  }

  private async handleIndexProgram(job: Job<{ programId: string }>) {
    const { programId } = job.data;
    if (!programId) {
      return;
    }

    const program = await this.programRepository.findOne({
      where: { id: programId },
    });
    if (!program) {
      return;
    }

    await this.programSearch.indexProgram(program);
  }

  private async handleReindexAll() {
    const programs = await this.programRepository.find({
      order: { publicationDate: 'ASC' },
    });

    for (const program of programs) {
      await this.programSearch.indexProgram(program);
    }
  }

  private async handleRemoval(job: Job<{ programId: string }>) {
    const { programId } = job.data;
    if (!programId) {
      return;
    }

    await this.programSearch.removeProgram(programId);
  }
}
