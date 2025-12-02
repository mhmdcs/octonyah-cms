import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { VideoIndexQueueService } from './video-index.queue.service';
import {
  VIDEO_INDEX_QUEUE,
  INDEX_VIDEO_JOB,
  REINDEX_ALL_JOB,
  REMOVE_VIDEO_JOB,
} from './video-index.queue';

describe('VideoIndexQueueService', () => {
  let service: VideoIndexQueueService;
  let queue: Queue;

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoIndexQueueService,
        { provide: getQueueToken(VIDEO_INDEX_QUEUE), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<VideoIndexQueueService>(VideoIndexQueueService);
    queue = module.get<Queue>(getQueueToken(VIDEO_INDEX_QUEUE));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueVideo', () => {
    it('should add index video job to queue', async () => {
      mockQueue.add.mockResolvedValue({});

      await service.enqueueVideo('test-uuid-1');

      expect(mockQueue.add).toHaveBeenCalledWith(
        INDEX_VIDEO_JOB,
        { videoId: 'test-uuid-1' },
        expect.objectContaining({
          removeOnComplete: 50,
          removeOnFail: 50,
        }),
      );
    });

    it('should not add job if videoId is undefined', async () => {
      await service.enqueueVideo(undefined);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should not add job if videoId is empty string', async () => {
      await service.enqueueVideo('');

      // The service checks for truthy value, empty string is falsy
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('enqueueFullReindex', () => {
    it('should add reindex all job to queue', async () => {
      mockQueue.add.mockResolvedValue({});

      await service.enqueueFullReindex();

      expect(mockQueue.add).toHaveBeenCalledWith(
        REINDEX_ALL_JOB,
        {},
        expect.objectContaining({
          removeOnComplete: false,
          removeOnFail: false,
        }),
      );
    });
  });

  describe('enqueueRemoval', () => {
    it('should add remove video job to queue', async () => {
      mockQueue.add.mockResolvedValue({});

      await service.enqueueRemoval('test-uuid-1');

      expect(mockQueue.add).toHaveBeenCalledWith(
        REMOVE_VIDEO_JOB,
        { videoId: 'test-uuid-1' },
        expect.objectContaining({
          removeOnComplete: 50,
          removeOnFail: 50,
        }),
      );
    });

    it('should not add job if videoId is undefined', async () => {
      await service.enqueueRemoval(undefined);

      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });
});

