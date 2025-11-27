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

@Controller()
export class ProgramEventsListener {
  private readonly logger = new Logger(ProgramEventsListener.name);

  @EventPattern(ProgramEventPattern.ProgramCreated)
  async handleProgramCreated(
    @Payload() data: ProgramEventMessage<Partial<Program>>,
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(
      `Program created event received: ${data.program.id}`,
    );
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
    this.ack(context);
  }

  private ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}

