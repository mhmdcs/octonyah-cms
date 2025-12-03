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

// Mock VideoSearchService module
jest.mock('../search/video-search.service', () => ({
  VideoSearchService: jest.fn().mockImplementation(() => ({
    removeVideo: jest.fn(),
    indexVideo: jest.fn(),
  })),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Video, VideoType, VideoPlatform } from '@octonyah/shared-videos';
import { CLEANUP_SOFT_DELETES_JOB } from './cleanup-soft-deletes.queue';
import { CleanupSoftDeletesProcessor } from './cleanup-soft-deletes.processor';
import { VideoSearchService } from '../search/video-search.service';

describe('CleanupSoftDeletesProcessor', () => {
  let processor: CleanupSoftDeletesProcessor;
  let videoSearchService: VideoSearchService;

  const mockQueryBuilder = {
    withDeleted: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({}),
    getMany: jest.fn(),
  };

  const mockVideoRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockVideoSearchService = {
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
    deletedAt: new Date('2024-01-01'),
    platform: VideoPlatform.NATIVE,
    ...overrides,
  } as Video);

  const createMockJob = (name: string): Job => ({
    name,
    id: 'job-1',
    data: {},
  } as Job);

  beforeEach(async () => {
    jest.clearAllMocks();
    mockVideoRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CleanupSoftDeletesProcessor,
        { provide: getRepositoryToken(Video), useValue: mockVideoRepository },
        { provide: VideoSearchService, useValue: mockVideoSearchService },
      ],
    }).compile();

    processor = module.get<CleanupSoftDeletesProcessor>(CleanupSoftDeletesProcessor);
    videoSearchService = module.get<VideoSearchService>(VideoSearchService);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should cleanup old soft-deleted videos', async () => {
      const oldVideos = [
        createMockVideo({ id: 'video-1' }),
        createMockVideo({ id: 'video-2' }),
      ];
      mockQueryBuilder.getMany.mockResolvedValue(oldVideos);
      const job = createMockJob(CLEANUP_SOFT_DELETES_JOB);

      await processor.process(job);

      expect(mockQueryBuilder.withDeleted).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('video.deletedAt IS NOT NULL');
      expect(mockVideoSearchService.removeVideo).toHaveBeenCalledTimes(2);
      expect(mockVideoSearchService.removeVideo).toHaveBeenCalledWith('video-1');
      expect(mockVideoSearchService.removeVideo).toHaveBeenCalledWith('video-2');
    });

    it('should not delete anything when no old soft-deleted videos found', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      const job = createMockJob(CLEANUP_SOFT_DELETES_JOB);

      await processor.process(job);

      expect(mockVideoSearchService.removeVideo).not.toHaveBeenCalled();
      expect(mockQueryBuilder.delete).not.toHaveBeenCalled();
    });

    it('should permanently delete videos from database', async () => {
      const oldVideos = [createMockVideo({ id: 'video-1' })];
      mockQueryBuilder.getMany.mockResolvedValue(oldVideos);
      const job = createMockJob(CLEANUP_SOFT_DELETES_JOB);

      await processor.process(job);

      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'id IN (:...ids)',
        { ids: ['video-1'] },
      );
    });

    it('should handle search removal errors gracefully', async () => {
      const oldVideos = [createMockVideo({ id: 'video-1' })];
      mockQueryBuilder.getMany.mockResolvedValue(oldVideos);
      mockVideoSearchService.removeVideo.mockRejectedValue(new Error('ES error'));
      const job = createMockJob(CLEANUP_SOFT_DELETES_JOB);

      // Should not throw even if ES removal fails
      await expect(processor.process(job)).resolves.not.toThrow();
    });

    it('should ignore non-cleanup jobs', async () => {
      const job = createMockJob('other-job');

      await processor.process(job);

      expect(mockQueryBuilder.getMany).not.toHaveBeenCalled();
    });
  });
});
