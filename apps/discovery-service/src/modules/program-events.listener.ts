import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  EventPattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  ProgramEventPattern,
  ProgramEventMessage,
  Program,
} from '@octonyah/shared-programs';
import { RedisCacheService } from '../cache/redis-cache.service';
import {
  SEARCH_CACHE_PREFIX,
  buildProgramCacheKey,
} from '../cache/cache.constants';
import { ProgramSearchService } from '../search/program-search.service';

@Controller()
export class ProgramEventsListener {
  private readonly logger = new Logger(ProgramEventsListener.name);

  constructor(
    private readonly cache: RedisCacheService,
    private readonly programSearch: ProgramSearchService,
  ) {}

  @EventPattern(ProgramEventPattern.ProgramCreated)
  async handleProgramCreated(
    @Payload() data: ProgramEventMessage<Partial<Program>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Program created event received: ${data.program.id}`,
    );
    await this.indexProgram(data.program);
    await this.invalidateCache(data.program?.id);
    this.ack(context);
  }

  @EventPattern(ProgramEventPattern.ProgramUpdated)
  async handleProgramUpdated(
    @Payload() data: ProgramEventMessage<Partial<Program>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Program updated event received: ${data.program.id}`,
    );
    await this.indexProgram(data.program);
    await this.invalidateCache(data.program?.id);
    this.ack(context);
  }

  @EventPattern(ProgramEventPattern.ProgramDeleted)
  async handleProgramDeleted(
    @Payload() data: ProgramEventMessage<Partial<Program>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Program deleted event received: ${data.program.id}`,
    );
    await this.programSearch.removeProgram(data.program?.id);
    await this.invalidateCache(data.program?.id);
    this.ack(context);
  }

  private async invalidateCache(programId?: string) {
    if (programId) {
      await this.cache.delete(buildProgramCacheKey(programId));
    }
    await this.cache.deleteByPrefix(SEARCH_CACHE_PREFIX);
  }

  private async indexProgram(program?: Partial<Program>) {
    if (!program?.id) {
      return;
    }
    await this.programSearch.indexProgram(program);
  }

  private ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}

