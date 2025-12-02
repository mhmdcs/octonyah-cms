import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import { VideoEventsPublisher, VIDEO_EVENTS_CLIENT } from './video-events.publisher';
import { Video, VideoType, VideoLanguage, VideoPlatform, VideoEventPattern } from '@octonyah/shared-videos';

describe('VideoEventsPublisher', () => {
  let publisher: VideoEventsPublisher;
  let mockClient: jest.Mocked<ClientProxy>;

  const createMockVideo = (overrides: Partial<Video> = {}): Video => ({
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
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    platform: VideoPlatform.NATIVE,
    ...overrides,
  } as Video);

  beforeEach(async () => {
    mockClient = {
      emit: jest.fn().mockReturnValue(of(undefined)),
      send: jest.fn(),
      connect: jest.fn(),
      close: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoEventsPublisher,
        { provide: VIDEO_EVENTS_CLIENT, useValue: mockClient },
      ],
    }).compile();

    publisher = module.get<VideoEventsPublisher>(VideoEventsPublisher);
  });

  it('should be defined', () => {
    expect(publisher).toBeDefined();
  });

  describe('videoCreated', () => {
    it('should emit video.created event', () => {
      const video = createMockVideo();

      publisher.videoCreated(video);

      expect(mockClient.emit).toHaveBeenCalledWith(
        VideoEventPattern.VideoCreated,
        expect.objectContaining({
          video: expect.objectContaining({
            id: 'test-uuid-1',
            title: 'Test Video',
          }),
        }),
      );
    });

    it('should sanitize dates in payload', () => {
      const video = createMockVideo({
        publicationDate: new Date('2024-06-15T10:00:00Z'),
      });

      publisher.videoCreated(video);

      expect(mockClient.emit).toHaveBeenCalledWith(
        VideoEventPattern.VideoCreated,
        expect.objectContaining({
          video: expect.objectContaining({
            publicationDate: '2024-06-15T10:00:00.000Z',
          }),
        }),
      );
    });

    it('should default tags to empty array', () => {
      const video = createMockVideo({ tags: undefined });

      publisher.videoCreated(video);

      expect(mockClient.emit).toHaveBeenCalledWith(
        VideoEventPattern.VideoCreated,
        expect.objectContaining({
          video: expect.objectContaining({
            tags: [],
          }),
        }),
      );
    });

    it('should default popularityScore to 0', () => {
      const video = createMockVideo({ popularityScore: undefined });

      publisher.videoCreated(video);

      expect(mockClient.emit).toHaveBeenCalledWith(
        VideoEventPattern.VideoCreated,
        expect.objectContaining({
          video: expect.objectContaining({
            popularityScore: 0,
          }),
        }),
      );
    });
  });

  describe('videoUpdated', () => {
    it('should emit video.updated event', () => {
      const video = createMockVideo();

      publisher.videoUpdated(video);

      expect(mockClient.emit).toHaveBeenCalledWith(
        VideoEventPattern.VideoUpdated,
        expect.objectContaining({
          video: expect.objectContaining({
            id: 'test-uuid-1',
          }),
        }),
      );
    });
  });

  describe('videoDeleted', () => {
    it('should emit video.deleted event with video ID', () => {
      publisher.videoDeleted({ id: 'test-uuid-1' });

      expect(mockClient.emit).toHaveBeenCalledWith(
        VideoEventPattern.VideoDeleted,
        expect.objectContaining({
          video: expect.objectContaining({
            id: 'test-uuid-1',
          }),
        }),
      );
    });

    it('should only include ID in payload for delete events', () => {
      publisher.videoDeleted({ id: 'test-uuid-1' });

      const emittedPayload = mockClient.emit.mock.calls[0][1] as { video: { id: string } };
      expect(emittedPayload.video.id).toBe('test-uuid-1');
    });
  });
});

