import { Channel, Message } from 'amqplib';
import { RmqContext } from '@nestjs/microservices';

export abstract class EventListenerBase {
  protected ack(context: RmqContext): void {
    const channel = context.getChannelRef() as Channel | undefined;
    const message = context.getMessage() as Message | undefined;
    if (channel?.ack && message?.content) channel.ack(message);
  }
}

