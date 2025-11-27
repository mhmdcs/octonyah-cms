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

@Controller()
export class ProgramEventsListener {
  private readonly logger = new Logger(ProgramEventsListener.name);

  constructor(private readonly cache: RedisCacheService) {}

  @EventPattern(ProgramEventPattern.ProgramCreated)
  async handleProgramCreated(
    @Payload() data: ProgramEventMessage<Partial<Program>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Program created event received: ${data.program.id}`,
    );
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
    await this.invalidateCache(data.program?.id);
    this.ack(context);
  }

  private async invalidateCache(programId?: string) {
    if (programId) {
      await this.cache.delete(buildProgramCacheKey(programId));
    }
    await this.cache.deleteByPrefix(SEARCH_CACHE_PREFIX);
  }

  private ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}

