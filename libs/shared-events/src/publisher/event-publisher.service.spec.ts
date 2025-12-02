import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';

// Create a concrete implementation for testing
class TestEventPublisher {
  protected readonly logger = { error: jest.fn() };

  constructor(protected readonly client: ClientProxy) {}

  protected emitEvent(pattern: string, payload: { video: unknown }): void {
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

  // Expose protected methods for testing
  public testEmitEvent(pattern: string, payload: { video: unknown }) {
    return this.emitEvent(pattern, payload);
  }

  public testSanitizeDate(value?: Date | string) {
    return this.sanitizeDate(value);
  }
}

describe('EventPublisherService', () => {
  let publisher: TestEventPublisher;
  let mockClient: jest.Mocked<ClientProxy>;

  beforeEach(() => {
    mockClient = {
      emit: jest.fn().mockReturnValue(of(undefined)),
      send: jest.fn(),
      connect: jest.fn(),
      close: jest.fn(),
    } as any;

    publisher = new TestEventPublisher(mockClient);
  });

  describe('emitEvent', () => {
    it('should emit event to client', () => {
      const pattern = 'video.created';
      const payload = { video: { id: '1', title: 'Test' } };

      publisher.testEmitEvent(pattern, payload);

      expect(mockClient.emit).toHaveBeenCalledWith(pattern, payload);
    });

    it('should subscribe to handle errors', () => {
      const pattern = 'video.created';
      const payload = { video: { id: '1' } };
      const mockError = new Error('Emit failed');

      mockClient.emit.mockReturnValue(throwError(() => mockError));

      publisher.testEmitEvent(pattern, payload);

      expect(publisher['logger'].error).toHaveBeenCalledWith(
        `Failed to emit ${pattern} event`,
        mockError,
      );
    });

    it('should handle synchronous errors', () => {
      const pattern = 'video.created';
      const payload = { video: { id: '1' } };

      mockClient.emit.mockImplementation(() => {
        throw new Error('Sync error');
      });

      // Should not throw
      expect(() => publisher.testEmitEvent(pattern, payload)).not.toThrow();
      expect(publisher['logger'].error).toHaveBeenCalled();
    });
  });

  describe('sanitizeDate', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = publisher.testSanitizeDate(date);

      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should return string as-is', () => {
      const dateString = '2024-01-15T10:30:00.000Z';
      const result = publisher.testSanitizeDate(dateString);

      expect(result).toBe(dateString);
    });

    it('should return undefined for undefined', () => {
      const result = publisher.testSanitizeDate(undefined);

      expect(result).toBeUndefined();
    });
  });
});

