// Mock @elastic/elasticsearch FIRST before any imports
jest.mock('@elastic/elasticsearch', () => ({
  errors: {
    ResponseError: class ResponseError extends Error {
      statusCode: number;
      constructor(message: string, statusCode: number = 404) {
        super(message);
        this.statusCode = statusCode;
      }
    },
  },
}));

// Mock @nestjs/elasticsearch
jest.mock('@nestjs/elasticsearch', () => ({
  ElasticsearchService: jest.fn(),
  ElasticsearchModule: {
    registerAsync: jest.fn().mockReturnValue({ module: class {} }),
  },
}));

// Mock VideoSearchService
jest.mock('../search/video-search.service', () => ({
  VideoSearchService: jest.fn().mockImplementation(() => ({
    indexVideo: jest.fn(),
    removeVideo: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Video, VideoType, VideoPlatform } from '@octonyah/shared-videos';
import { INDEX_VIDEO_JOB, REINDEX_ALL_JOB, REMOVE_VIDEO_JOB } from './video-index.queue';
import { VideoIndexProcessor } from './video-index.processor';
import { VideoSearchService } from '../search/video-search.service';

describe('VideoIndexProcessor', () => {
  let processor: VideoIndexProcessor;
  let videoRepository: Repository<Video>;
  let videoSearchService: VideoSearchService;

  const mockVideoRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockVideoSearchService = {
    indexVideo: jest.fn(),
    removeVideo: jest.fn(),
  };

  const createMockVideo = (overrides: Partial<Video> = {}): Video => ({
    id: 'test-uuid-1',
    title: 'Test Video',
    description: 'Test Description',
    category: 'Technology',
    type: VideoType.VIDEO_PODCAST,
    duration: 3600,
    tags: ['tech', 'podcast'],
    publicationDate: new Date('2024-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    platform: VideoPlatform.NATIVE,
    ...overrides,
  } as Video);

  const createMockJob = (name: string, data: any): Job => ({
    name,
    data,
    id: 'job-1',
  } as Job);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoIndexProcessor,
        { provide: getRepositoryToken(Video), useValue: mockVideoRepository },
        { provide: VideoSearchService, useValue: mockVideoSearchService },
      ],
    }).compile();

    processor = module.get<VideoIndexProcessor>(VideoIndexProcessor);
    videoRepository = module.get<Repository<Video>>(getRepositoryToken(Video));
    videoSearchService = module.get<VideoSearchService>(VideoSearchService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    describe('INDEX_VIDEO_JOB', () => {
      it('should index a video when found', async () => {
        const video = createMockVideo();
        mockVideoRepository.findOne.mockResolvedValue(video);
        const job = createMockJob(INDEX_VIDEO_JOB, { videoId: 'test-uuid-1' });

        await processor.process(job);

        expect(mockVideoRepository.findOne).toHaveBeenCalledWith({
          where: { id: 'test-uuid-1' },
          withDeleted: true,
        });
        expect(mockVideoSearchService.indexVideo).toHaveBeenCalledWith(video);
      });

      it('should remove soft-deleted video from index', async () => {
        const deletedVideo = createMockVideo({ deletedAt: new Date() });
        mockVideoRepository.findOne.mockResolvedValue(deletedVideo);
        const job = createMockJob(INDEX_VIDEO_JOB, { videoId: 'test-uuid-1' });

        await processor.process(job);

        expect(mockVideoSearchService.removeVideo).toHaveBeenCalledWith('test-uuid-1');
        expect(mockVideoSearchService.indexVideo).not.toHaveBeenCalled();
      });

      it('should do nothing if video not found', async () => {
        mockVideoRepository.findOne.mockResolvedValue(null);
        const job = createMockJob(INDEX_VIDEO_JOB, { videoId: 'non-existent' });

        await processor.process(job);

        expect(mockVideoSearchService.indexVideo).not.toHaveBeenCalled();
        expect(mockVideoSearchService.removeVideo).not.toHaveBeenCalled();
      });

      it('should do nothing if videoId is undefined', async () => {
        const job = createMockJob(INDEX_VIDEO_JOB, { videoId: undefined });

        await processor.process(job);

        expect(mockVideoRepository.findOne).not.toHaveBeenCalled();
      });
    });

    describe('REINDEX_ALL_JOB', () => {
      it('should reindex all videos', async () => {
        const videos = [
          createMockVideo({ id: 'video-1' }),
          createMockVideo({ id: 'video-2' }),
        ];
        mockVideoRepository.find.mockResolvedValue(videos);
        const job = createMockJob(REINDEX_ALL_JOB, {});

        await processor.process(job);

        expect(mockVideoRepository.find).toHaveBeenCalledWith({
          order: { publicationDate: 'ASC' },
        });
        expect(mockVideoSearchService.indexVideo).toHaveBeenCalledTimes(2);
        expect(mockVideoSearchService.indexVideo).toHaveBeenCalledWith(videos[0]);
        expect(mockVideoSearchService.indexVideo).toHaveBeenCalledWith(videos[1]);
      });

      it('should handle empty video list', async () => {
        mockVideoRepository.find.mockResolvedValue([]);
        const job = createMockJob(REINDEX_ALL_JOB, {});

        await processor.process(job);

        expect(mockVideoSearchService.indexVideo).not.toHaveBeenCalled();
      });
    });

    describe('REMOVE_VIDEO_JOB', () => {
      it('should remove video from search index', async () => {
        const job = createMockJob(REMOVE_VIDEO_JOB, { videoId: 'test-uuid-1' });

        await processor.process(job);

        expect(mockVideoSearchService.removeVideo).toHaveBeenCalledWith('test-uuid-1');
      });

      it('should not call removeVideo if videoId is undefined', async () => {
        const job = createMockJob(REMOVE_VIDEO_JOB, { videoId: undefined });

        await processor.process(job);

        expect(mockVideoSearchService.removeVideo).not.toHaveBeenCalled();
      });
    });

    it('should handle unknown job names gracefully', async () => {
      const job = createMockJob('unknown-job', {});

      // Should not throw
      await expect(processor.process(job)).resolves.not.toThrow();
    });
  });
});
