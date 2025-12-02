import { Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface EventPayload<T = unknown> {
  video: T;
}

@Injectable()
export abstract class EventPublisherService {
  protected readonly logger: Logger;

  constructor(protected readonly client: ClientProxy) {
    this.logger = new Logger(this.constructor.name);
  }

  protected emitEvent(pattern: string, payload: EventPayload): void {
    try {
      this.client.emit(pattern, payload).subscribe({
        error: (error) =>
          this.logger.error(`Failed to emit ${pattern} event`, error),
      });
    } catch (error) {
      this.logger.error(`Error emitting ${pattern} event`, error);
    }
  }

  protected sanitizeDate(value?: Date | string): string | undefined {
    return value instanceof Date ? value.toISOString() : value;
  }
}

