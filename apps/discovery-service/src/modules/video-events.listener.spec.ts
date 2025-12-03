import { Test, TestingModule } from '@nestjs/testing';
import { RmqContext } from '@nestjs/microservices';
import { VideoEventsListener } from './video-events.listener';
import { RedisCacheService } from '@octonyah/shared-cache';
import { VideoIndexQueueService } from '../jobs/video-index.queue.service';
import { Video, VideoType, VideoPlatform } from '@octonyah/shared-videos';

describe('VideoEventsListener', () => {
  let listener: VideoEventsListener;
  let cacheService: RedisCacheService;
  let videoIndexQueue: VideoIndexQueueService;

  const mockCacheService = {
    delete: jest.fn(),
    deleteByPrefix: jest.fn(),
  };

  const mockVideoIndexQueueService = {
    enqueueVideo: jest.fn(),
    enqueueRemoval: jest.fn(),
  };

  const createMockContext = (): RmqContext => {
    const mockChannel = {
      ack: jest.fn(),
    };
    const mockMessage = {
      content: Buffer.from('test'),
    };
    return {
      getChannelRef: () => mockChannel,
      getMessage: () => mockMessage,
      getPattern: () => 'test.pattern',
      getArgs: () => [],
    } as unknown as RmqContext;
  };

  const createMockVideo = (overrides: Partial<Video> = {}): Partial<Video> => ({
    id: 'test-uuid-1',
    title: 'Test Video',
    description: 'Test Description',
    category: 'Technology',
    type: VideoType.VIDEO_PODCAST,
    duration: 3600,
    tags: ['tech', 'podcast'],
    platform: VideoPlatform.NATIVE,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoEventsListener,
        { provide: RedisCacheService, useValue: mockCacheService },
        { provide: VideoIndexQueueService, useValue: mockVideoIndexQueueService },
      ],
    }).compile();

    listener = module.get<VideoEventsListener>(VideoEventsListener);
    cacheService = module.get<RedisCacheService>(RedisCacheService);
    videoIndexQueue = module.get<VideoIndexQueueService>(VideoIndexQueueService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleVideoCreated', () => {
    it('should enqueue video for indexing and invalidate cache', async () => {
      const video = createMockVideo();
      const context = createMockContext();

      await listener.handleVideoCreated({ video }, context);

      expect(mockVideoIndexQueueService.enqueueVideo).toHaveBeenCalledWith('test-uuid-1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('discovery:video:test-uuid-1');
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalledWith('discovery:search');
    });

    it('should acknowledge the message', async () => {
      const video = createMockVideo();
      const context = createMockContext();

      await listener.handleVideoCreated({ video }, context);

      const channel = context.getChannelRef();
      expect(channel.ack).toHaveBeenCalled();
    });
  });

  describe('handleVideoUpdated', () => {
    it('should enqueue video for reindexing and invalidate cache', async () => {
      const video = createMockVideo();
      const context = createMockContext();

      await listener.handleVideoUpdated({ video }, context);

      expect(mockVideoIndexQueueService.enqueueVideo).toHaveBeenCalledWith('test-uuid-1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('discovery:video:test-uuid-1');
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalledWith('discovery:search');
    });

    it('should acknowledge the message', async () => {
      const video = createMockVideo();
      const context = createMockContext();

      await listener.handleVideoUpdated({ video }, context);

      const channel = context.getChannelRef();
      expect(channel.ack).toHaveBeenCalled();
    });
  });

  describe('handleVideoDeleted', () => {
    it('should enqueue video for removal and invalidate cache', async () => {
      const video = createMockVideo();
      const context = createMockContext();

      await listener.handleVideoDeleted({ video }, context);

      expect(mockVideoIndexQueueService.enqueueRemoval).toHaveBeenCalledWith('test-uuid-1');
      expect(mockCacheService.delete).toHaveBeenCalledWith('discovery:video:test-uuid-1');
      expect(mockCacheService.deleteByPrefix).toHaveBeenCalledWith('discovery:search');
    });

    it('should acknowledge the message', async () => {
      const video = createMockVideo();
      const context = createMockContext();

      await listener.handleVideoDeleted({ video }, context);

      const channel = context.getChannelRef();
      expect(channel.ack).toHaveBeenCalled();
    });
  });
});

