import { Test, TestingModule } from '@nestjs/testing';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ImportVideoDto } from './dto/import-video.dto';
import { Video, VideoType, VideoLanguage, VideoPlatform } from '@octonyah/shared-videos';

describe('VideosController', () => {
  let controller: VideosController;
  let service: VideosService;

  const mockVideo: Partial<Video> = {
    id: 'test-uuid-1',
    title: 'Test Video',
    description: 'Test Description',
    category: 'Technology',
    type: VideoType.VIDEO_PODCAST,
    language: VideoLanguage.ARABIC,
    duration: 3600,
    tags: ['tech', 'podcast'],
    popularityScore: 10,
    publicationDate: new Date('2024-01-01'),
    createdAt: new Date(),
    updatedAt: new Date(),
    platform: VideoPlatform.NATIVE,
  };

  const mockVideosService = {
    create: jest.fn(),
    importFromPlatform: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideosController],
      providers: [
        { provide: VideosService, useValue: mockVideosService },
      ],
    }).compile();

    controller = module.get<VideosController>(VideosController);
    service = module.get<VideosService>(VideosService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a video', async () => {
      const createDto: CreateVideoDto = {
        title: 'Test Video',
        description: 'Test Description',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
        language: VideoLanguage.ARABIC,
        duration: 3600,
        publicationDate: '2024-01-01',
        tags: ['tech', 'podcast'],
        popularityScore: 10,
      };

      mockVideosService.create.mockResolvedValue(mockVideo);

      const result = await controller.create(createDto);

      expect(result).toEqual(mockVideo);
      expect(mockVideosService.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('importVideo', () => {
    it('should import a video from external platform', async () => {
      const importDto: ImportVideoDto = {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Entertainment',
        type: VideoType.VIDEO_PODCAST,
      };

      const importedVideo = {
        ...mockVideo,
        platform: VideoPlatform.YOUTUBE,
        platformVideoId: 'dQw4w9WgXcQ',
      };

      mockVideosService.importFromPlatform.mockResolvedValue(importedVideo);

      const result = await controller.importVideo(importDto);

      expect(result).toEqual(importedVideo);
      expect(mockVideosService.importFromPlatform).toHaveBeenCalledWith(importDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of videos', async () => {
      const videos = [mockVideo, { ...mockVideo, id: 'test-uuid-2' }];
      mockVideosService.findAll.mockResolvedValue(videos);

      const result = await controller.findAll();

      expect(result).toEqual(videos);
      expect(mockVideosService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no videos exist', async () => {
      mockVideosService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single video', async () => {
      mockVideosService.findOne.mockResolvedValue(mockVideo);

      const result = await controller.findOne('test-uuid-1');

      expect(result).toEqual(mockVideo);
      expect(mockVideosService.findOne).toHaveBeenCalledWith('test-uuid-1');
    });
  });

  describe('update', () => {
    it('should update a video', async () => {
      const updateDto: UpdateVideoDto = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      const updatedVideo = { ...mockVideo, ...updateDto };
      mockVideosService.update.mockResolvedValue(updatedVideo);

      const result = await controller.update('test-uuid-1', updateDto);

      expect(result).toEqual(updatedVideo);
      expect(mockVideosService.update).toHaveBeenCalledWith('test-uuid-1', updateDto);
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdateVideoDto = {
        popularityScore: 100,
      };

      const updatedVideo = { ...mockVideo, popularityScore: 100 };
      mockVideosService.update.mockResolvedValue(updatedVideo);

      const result = await controller.update('test-uuid-1', updateDto);

      expect(result.popularityScore).toBe(100);
    });
  });

  describe('remove', () => {
    it('should remove a video', async () => {
      mockVideosService.remove.mockResolvedValue(undefined);

      await controller.remove('test-uuid-1');

      expect(mockVideosService.remove).toHaveBeenCalledWith('test-uuid-1');
    });
  });
});

