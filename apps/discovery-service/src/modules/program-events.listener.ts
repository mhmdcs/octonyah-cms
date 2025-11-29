import { Controller, Logger } from '@nestjs/common';
import { Channel, Message } from 'amqplib';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
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
import { ProgramIndexQueueService } from '../jobs/program-index.queue.service';

@Controller()
export class ProgramEventsListener {
  private readonly logger = new Logger(ProgramEventsListener.name);

  constructor(
    private readonly cache: RedisCacheService,
    private readonly programIndexQueue: ProgramIndexQueueService,
  ) {}

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

  private ack(context: RmqContext) {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const channelRef: unknown = context.getChannelRef();
    const originalMsg: unknown = context.getMessage();

    if (this.isAmqpChannel(channelRef) && this.isAmqpMessage(originalMsg)) {
      channelRef.ack(originalMsg); // confirmed channel acknowledges confirmed mssage
    }
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
  }

  private isAmqpChannel(channel: unknown): channel is Channel {
    if (!channel || typeof channel !== 'object') {
      return false;
    }
    const candidate = channel as { ack?: unknown };
    return typeof candidate.ack === 'function';
  }

  private isAmqpMessage(message: unknown): message is Message {
    return (typeof message === 'object' && message !== null && 'content' in message);
  }
}
