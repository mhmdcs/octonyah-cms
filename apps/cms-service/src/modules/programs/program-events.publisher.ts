import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  Program,
  ProgramEventPattern,
  ProgramEventMessage,
} from '@octonyah/shared-programs';

export const PROGRAM_EVENTS_CLIENT = 'PROGRAM_EVENTS_CLIENT';

@Injectable()
export class ProgramEventsPublisher {
  private readonly logger = new Logger(ProgramEventsPublisher.name);

  constructor(
    @Inject(PROGRAM_EVENTS_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  programCreated(program: Program) {
    this.emitEvent(ProgramEventPattern.ProgramCreated, program);
  }

  programUpdated(program: Program) {
    this.emitEvent(ProgramEventPattern.ProgramUpdated, program);
  }

  programDeleted(program: Pick<Program, 'id'>) {
    this.emitEvent(ProgramEventPattern.ProgramDeleted, program);
  }

  private emitEvent(pattern: string, program: Partial<Program>): void {
    const payload: ProgramEventMessage<Record<string, unknown>> = {
      program: this.sanitizeProgram(program),
    };

    try {
      this.client.emit(pattern, payload).subscribe({
        error: (error) =>
          this.logger.error(
            `Failed to emit ${pattern} event`,
            error,
          ),
      });
    } catch (error) {
      this.logger.error(`Error emitting ${pattern} event`, error);
    }
  }

  private sanitizeProgram(program: Partial<Program>) {
    return {
      ...program,
      tags: program.tags ?? [],
      popularityScore: program.popularityScore ?? 0,
      publicationDate: this.toIso(program.publicationDate),
      createdAt: this.toIso(program.createdAt),
      updatedAt: this.toIso(program.updatedAt),
    };
  }

  private toIso(value?: Date | string): string | undefined {
    return value instanceof Date ? value.toISOString() : value;
  }
}

