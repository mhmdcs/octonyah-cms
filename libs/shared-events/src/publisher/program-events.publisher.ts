import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EventPublisherService } from './event-publisher.service';
import {
  Program,
  ProgramEventPattern,
  ProgramEventMessage,
} from '@octonyah/shared-programs';

export const PROGRAM_EVENTS_CLIENT = 'PROGRAM_EVENTS_CLIENT';

@Injectable()
export class ProgramEventsPublisher extends EventPublisherService {
  constructor(
    @Inject(PROGRAM_EVENTS_CLIENT)
    client: ClientProxy,
  ) {
    super(client);
  }

  programCreated(program: Program): void {
    this.emitEvent(ProgramEventPattern.ProgramCreated, {
      program: this.sanitizeProgram(program),
    });
  }

  programUpdated(program: Program): void {
    this.emitEvent(ProgramEventPattern.ProgramUpdated, {
      program: this.sanitizeProgram(program),
    });
  }

  programDeleted(program: Pick<Program, 'id'>): void {
    this.emitEvent(ProgramEventPattern.ProgramDeleted, {
      program: this.sanitizeProgram(program),
    });
  }

  private sanitizeProgram(program: Partial<Program>): ProgramEventMessage<Record<string, unknown>>['program'] {
    return {
      ...program,
      tags: program.tags ?? [],
      popularityScore: program.popularityScore ?? 0,
      publicationDate: this.sanitizeDate(program.publicationDate),
      createdAt: this.sanitizeDate(program.createdAt),
      updatedAt: this.sanitizeDate(program.updatedAt),
    } as Record<string, unknown>;
  }
}

