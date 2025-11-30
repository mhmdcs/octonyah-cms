import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  ProgramEventPattern,
  ProgramEventMessage,
  Program,
} from '@octonyah/shared-programs';
import { RedisCacheService, SEARCH_CACHE_PREFIX, buildProgramCacheKey } from '@octonyah/shared-cache';
import { EventListenerBase } from '@octonyah/shared-events';
import { ProgramIndexQueueService } from '../jobs/program-index.queue.service';

@Controller()
export class ProgramEventsListener extends EventListenerBase {
  private readonly logger = new Logger(ProgramEventsListener.name);

  constructor(
    private readonly cache: RedisCacheService,
    private readonly programIndexQueue: ProgramIndexQueueService,
  ) {
    super();
  }

  @EventPattern(ProgramEventPattern.ProgramCreated)
  async handleProgramCreated(
    @Payload() data: ProgramEventMessage<Partial<Program>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Program created event received: ${data.program.id}`);
    await this.enqueueIndex(data.program);
    await this.invalidateCache(data.program?.id);
    this.ack(context);
  }

  @EventPattern(ProgramEventPattern.ProgramUpdated)
  async handleProgramUpdated(
    @Payload() data: ProgramEventMessage<Partial<Program>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Program updated event received: ${data.program.id}`);
    await this.enqueueIndex(data.program);
    await this.invalidateCache(data.program?.id);
    this.ack(context);
  }

  @EventPattern(ProgramEventPattern.ProgramDeleted)
  async handleProgramDeleted(
    @Payload() data: ProgramEventMessage<Partial<Program>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Program deleted event received: ${data.program.id}`);
    await this.programIndexQueue.enqueueRemoval(data.program?.id);
    await this.invalidateCache(data.program?.id);
    this.ack(context);
  }

  private async invalidateCache(programId?: string) {
    if (programId) {
      await this.cache.delete(buildProgramCacheKey(programId));
    }
    await this.cache.deleteByPrefix(SEARCH_CACHE_PREFIX);
  }

  private async enqueueIndex(program?: Partial<Program>) {
    await this.programIndexQueue.enqueueProgram(program?.id);
  }
}
