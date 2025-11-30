import { Channel, Message } from 'amqplib';
import { RmqContext } from '@nestjs/microservices';

export abstract class EventListenerBase {
  protected ack(context: RmqContext): void {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const channelRef: unknown = context.getChannelRef();
    const originalMsg: unknown = context.getMessage();

    if (this.isAmqpChannel(channelRef) && this.isAmqpMessage(originalMsg)) {
      channelRef.ack(originalMsg); // confirmed channel acknowledges confirmed message
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
    return (
      typeof message === 'object' && message !== null && 'content' in message
    );
  }
}

