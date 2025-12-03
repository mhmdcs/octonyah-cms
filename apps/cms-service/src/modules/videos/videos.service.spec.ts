// Videos Service Test Suite
// Comprehensive unit tests for VideosService

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoType, VideoPlatform } from '@octonyah/shared-videos';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideoEventsPublisher } from '@octonyah/shared-events';
import { VideoPlatformsService, VideoMetadata } from '@octonyah/shared-video-platforms';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ImportVideoDto } from './dto/import-video.dto';

describe('VideosService', () => {
  let service: VideosService;
  let repository: Repository<Video>;
  let videoEventsPublisher: VideoEventsPublisher;
  let videoPlatformsService: VideoPlatformsService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
  };

  const mockVideoEventsPublisher = {
    videoCreated: jest.fn(),
    videoUpdated: jest.fn(),
    videoDeleted: jest.fn(),
    reindexRequested: jest.fn(),
  };

  const mockVideoPlatformsService = {
    fetchMetadataFromUrl: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        { provide: getRepositoryToken(Video), useValue: mockRepository },
        { provide: VideoEventsPublisher, useValue: mockVideoEventsPublisher },
        { provide: VideoPlatformsService, useValue: mockVideoPlatformsService },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    repository = module.get<Repository<Video>>(getRepositoryToken(Video));
    videoEventsPublisher = module.get<VideoEventsPublisher>(VideoEventsPublisher);
    videoPlatformsService = module.get<VideoPlatformsService>(VideoPlatformsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('importFromPlatform', () => {
    const mockMetadata: VideoMetadata = {
      platform: VideoPlatform.YOUTUBE,
      platformVideoId: 'abc123',
      title: 'YouTube Video',
      description: 'YouTube Description',
      durationSeconds: 600,
      thumbnailUrl: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg',
      embedUrl: 'https://www.youtube.com/embed/abc123',
      originalUrl: 'https://www.youtube.com/watch?v=abc123',
      publishedAt: new Date('2024-01-01'),
      tags: ['youtube', 'video'],
    };

    it('should import video from external platform', async () => {
      const importDto: ImportVideoDto = {
        url: 'https://www.youtube.com/watch?v=abc123',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
      };

      mockVideoPlatformsService.fetchMetadataFromUrl.mockResolvedValue(mockMetadata);
      mockRepository.findOne.mockResolvedValue(null);

      const importedVideo = createMockVideo({
        platform: VideoPlatform.YOUTUBE,
        platformVideoId: 'abc123',
      });
      mockRepository.create.mockReturnValue(importedVideo);
      mockRepository.save.mockResolvedValue(importedVideo);

      const result = await service.importFromPlatform(importDto);

      expect(result).toEqual(importedVideo);
      expect(mockVideoPlatformsService.fetchMetadataFromUrl).toHaveBeenCalledWith(importDto.url);
      expect(mockVideoEventsPublisher.videoCreated).toHaveBeenCalledWith(importedVideo);
    });

    it('should throw ConflictException when video already exists', async () => {
      const importDto: ImportVideoDto = {
        url: 'https://www.youtube.com/watch?v=abc123',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
      };

      mockVideoPlatformsService.fetchMetadataFromUrl.mockResolvedValue(mockMetadata);
      mockRepository.findOne.mockResolvedValue(createMockVideo());

      await expect(service.importFromPlatform(importDto)).rejects.toThrow(ConflictException);
    });

    it('should allow overriding title from metadata', async () => {
      const importDto: ImportVideoDto = {
        url: 'https://www.youtube.com/watch?v=abc123',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
        title: 'Custom Title',
      };

      mockVideoPlatformsService.fetchMetadataFromUrl.mockResolvedValue(mockMetadata);
      mockRepository.findOne.mockResolvedValue(null);

      const importedVideo = createMockVideo({ title: 'Custom Title' });
      mockRepository.create.mockReturnValue(importedVideo);
      mockRepository.save.mockResolvedValue(importedVideo);

      await service.importFromPlatform(importDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Custom Title' }),
      );
    });

    it('should allow overriding description from metadata', async () => {
      const importDto: ImportVideoDto = {
        url: 'https://www.youtube.com/watch?v=abc123',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
        description: 'Custom Description',
      };

      mockVideoPlatformsService.fetchMetadataFromUrl.mockResolvedValue(mockMetadata);
      mockRepository.findOne.mockResolvedValue(null);

      const importedVideo = createMockVideo({ description: 'Custom Description' });
      mockRepository.create.mockReturnValue(importedVideo);
      mockRepository.save.mockResolvedValue(importedVideo);

      await service.importFromPlatform(importDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: 'Custom Description' }),
      );
    });

    it('should merge user tags with platform tags', async () => {
      const importDto: ImportVideoDto = {
        url: 'https://www.youtube.com/watch?v=abc123',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
        tags: ['custom', 'tags'],
      };

      mockVideoPlatformsService.fetchMetadataFromUrl.mockResolvedValue(mockMetadata);
      mockRepository.findOne.mockResolvedValue(null);

      const importedVideo = createMockVideo();
      mockRepository.create.mockReturnValue(importedVideo);
      mockRepository.save.mockResolvedValue(importedVideo);

      await service.importFromPlatform(importDto);

      // User tags should come first, then platform tags (without duplicates)
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.arrayContaining(['custom', 'tags']),
        }),
      );
    });

  });

  describe('findAll', () => {
    it('should return all videos ordered by publication date DESC', async () => {
      const videos = [
        createMockVideo({ id: '1', publicationDate: new Date('2024-02-01') }),
        createMockVideo({ id: '2', publicationDate: new Date('2024-01-01') }),
      ];
      mockRepository.find.mockResolvedValue(videos);

      const result = await service.findAll();

      expect(result).toEqual(videos);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { publicationDate: 'DESC' },
      });
    });

    it('should return empty array when no videos exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a video by ID', async () => {
      const video = createMockVideo();
      mockRepository.findOne.mockResolvedValue(video);

      const result = await service.findOne('test-uuid-1');

      expect(result).toEqual(video);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-uuid-1' },
      });
    });

    it('should throw NotFoundException when video not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        'Video with ID non-existent not found',
      );
    });
  });

  describe('update', () => {
    it('should update video fields', async () => {
      const existingVideo = createMockVideo();
      const updateDto: UpdateVideoDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      mockRepository.findOne.mockResolvedValue({ ...existingVideo });
      const updatedVideo = { ...existingVideo, ...updateDto };
      mockRepository.save.mockResolvedValue(updatedVideo);

      const result = await service.update('test-uuid-1', updateDto);

      expect(result.title).toBe('Updated Title');
      expect(mockVideoEventsPublisher.videoUpdated).toHaveBeenCalled();
    });

    it('should update tags when provided', async () => {
      const existingVideo = createMockVideo();
      const updateDto: UpdateVideoDto = {
        tags: ['new', 'tags'],
      };

      mockRepository.findOne.mockResolvedValue({ ...existingVideo });
      mockRepository.save.mockImplementation((video) => Promise.resolve(video));

      const result = await service.update('test-uuid-1', updateDto);

      expect(result.tags).toEqual(['new', 'tags']);
    });

    it('should update publicationDate when provided', async () => {
      const existingVideo = createMockVideo();
      const updateDto: UpdateVideoDto = {
        publicationDate: '2025-06-15',
      };

      mockRepository.findOne.mockResolvedValue({ ...existingVideo });
      mockRepository.save.mockImplementation((video) => Promise.resolve(video));

      const result = await service.update('test-uuid-1', updateDto);

      expect(result.publicationDate).toEqual(new Date('2025-06-15'));
    });

    it('should throw NotFoundException when video not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a video', async () => {
      const video = createMockVideo();
      mockRepository.findOne.mockResolvedValue(video);
      mockRepository.softRemove.mockResolvedValue(video);

      await service.remove('test-uuid-1');

      expect(mockRepository.softRemove).toHaveBeenCalledWith(video);
      expect(mockVideoEventsPublisher.videoDeleted).toHaveBeenCalledWith({ id: 'test-uuid-1' });
    });

    it('should throw NotFoundException when video not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('triggerReindex', () => {
    it('should publish reindex requested event', () => {
      service.triggerReindex();

      expect(mockVideoEventsPublisher.reindexRequested).toHaveBeenCalled();
    });
  });
});
