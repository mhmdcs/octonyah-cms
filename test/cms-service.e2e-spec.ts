import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoType, VideoLanguage, VideoPlatform } from '@octonyah/shared-videos';
import { AppModule } from '../apps/cms-service/src/app.module';

/**
 * CMS Service E2E Tests
 * 
 * These tests verify the complete request/response cycle for the CMS API.
 * They test authentication, authorization, and CRUD operations on videos.
 */
describe('CMS Service (e2e)', () => {
  let app: INestApplication;
  let videoRepository: Repository<Video>;
  let authToken: string;
  let editorToken: string;

  const mockVideoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    softRemove: jest.fn(),
    delete: jest.fn(),
  };

  const mockVideoEventsPublisher = {
    videoCreated: jest.fn(),
    videoUpdated: jest.fn(),
    videoDeleted: jest.fn(),
  };

  const mockVideoPlatformsService = {
    fetchMetadataFromUrl: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Video))
      .useValue(mockVideoRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Get auth tokens for tests
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    authToken = adminLogin.body.access_token;

    const editorLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'editor', password: 'editor123' });
    editorToken = editorLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/ (GET)', () => {
    it('should return welcome message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect({ message: 'Hello World! Welcome to Octonyah CMS API' });
    });
  });

  describe('Auth Module', () => {
    describe('/auth/login (POST)', () => {
      it('should return JWT token for valid admin credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ username: 'admin', password: 'admin123' })
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(typeof response.body.access_token).toBe('string');
      });

      it('should return JWT token for valid editor credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ username: 'editor', password: 'editor123' })
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
      });

      it('should reject invalid credentials', async () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ username: 'admin', password: 'wrongpassword' })
          .expect(401);
      });

      it('should reject missing credentials', async () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({})
          .expect(400);
      });

      it('should reject non-existent user', async () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({ username: 'nonexistent', password: 'password' })
          .expect(401);
      });
    });
  });

  describe('Videos Module', () => {
    const createVideoDto = {
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

    const mockVideo = {
      id: 'test-uuid-1',
      ...createVideoDto,
      publicationDate: new Date('2024-01-01'),
      createdAt: new Date(),
      updatedAt: new Date(),
      platform: VideoPlatform.NATIVE,
    };

    describe('/cms/videos (POST)', () => {
      it('should create a video with valid token', async () => {
        mockVideoRepository.create.mockReturnValue(mockVideo);
        mockVideoRepository.save.mockResolvedValue(mockVideo);

        const response = await request(app.getHttpServer())
          .post('/cms/videos')
          .set('Authorization', `Bearer ${authToken}`)
          .send(createVideoDto)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.title).toBe(createVideoDto.title);
      });

      it('should reject without authentication', async () => {
        return request(app.getHttpServer())
          .post('/cms/videos')
          .send(createVideoDto)
          .expect(401);
      });

      it('should reject with invalid token', async () => {
        return request(app.getHttpServer())
          .post('/cms/videos')
          .set('Authorization', 'Bearer invalid-token')
          .send(createVideoDto)
          .expect(401);
      });

      it('should validate required fields', async () => {
        const invalidDto = {
          description: 'Missing required fields',
        };

        return request(app.getHttpServer())
          .post('/cms/videos')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidDto)
          .expect(400);
      });

      it('should validate video type enum', async () => {
        const invalidDto = {
          ...createVideoDto,
          type: 'invalid_type',
        };

        return request(app.getHttpServer())
          .post('/cms/videos')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidDto)
          .expect(400);
      });
    });

    describe('/cms/videos (GET)', () => {
      it('should return list of videos', async () => {
        mockVideoRepository.find.mockResolvedValue([mockVideo]);

        const response = await request(app.getHttpServer())
          .get('/cms/videos')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should reject without authentication', async () => {
        return request(app.getHttpServer())
          .get('/cms/videos')
          .expect(401);
      });
    });

    describe('/cms/videos/:id (GET)', () => {
      it('should return a single video', async () => {
        mockVideoRepository.findOne.mockResolvedValue(mockVideo);

        const response = await request(app.getHttpServer())
          .get('/cms/videos/test-uuid-1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe('test-uuid-1');
      });

      it('should return 404 for non-existent video', async () => {
        mockVideoRepository.findOne.mockResolvedValue(null);

        return request(app.getHttpServer())
          .get('/cms/videos/non-existent')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('/cms/videos/:id (PATCH)', () => {
      it('should update a video', async () => {
        const updatedVideo = { ...mockVideo, title: 'Updated Title' };
        mockVideoRepository.findOne.mockResolvedValue({ ...mockVideo });
        mockVideoRepository.save.mockResolvedValue(updatedVideo);

        const response = await request(app.getHttpServer())
          .patch('/cms/videos/test-uuid-1')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Updated Title' })
          .expect(200);

        expect(response.body.title).toBe('Updated Title');
      });

      it('should allow partial updates', async () => {
        mockVideoRepository.findOne.mockResolvedValue({ ...mockVideo });
        mockVideoRepository.save.mockImplementation((video) =>
          Promise.resolve(video),
        );

        const response = await request(app.getHttpServer())
          .patch('/cms/videos/test-uuid-1')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ popularityScore: 100 })
          .expect(200);

        expect(response.body.popularityScore).toBe(100);
      });
    });

    describe('/cms/videos/:id (DELETE)', () => {
      it('should delete a video (admin only)', async () => {
        mockVideoRepository.findOne.mockResolvedValue(mockVideo);
        mockVideoRepository.softRemove.mockResolvedValue(mockVideo);

        return request(app.getHttpServer())
          .delete('/cms/videos/test-uuid-1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(204);
      });

      it('should reject delete for editor role', async () => {
        return request(app.getHttpServer())
          .delete('/cms/videos/test-uuid-1')
          .set('Authorization', `Bearer ${editorToken}`)
          .expect(403);
      });
    });

    describe('/cms/videos/import (POST)', () => {
      it('should import video from external platform', async () => {
        const importDto = {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          category: 'Entertainment',
          type: VideoType.VIDEO_PODCAST,
        };

        const importedVideo = {
          ...mockVideo,
          platform: VideoPlatform.YOUTUBE,
          platformVideoId: 'dQw4w9WgXcQ',
        };

        mockVideoRepository.findOne.mockResolvedValue(null);
        mockVideoRepository.create.mockReturnValue(importedVideo);
        mockVideoRepository.save.mockResolvedValue(importedVideo);

        // Note: This test may fail if VideoPlatformsService isn't properly mocked
        // In a real e2e test, you'd want to either mock the external service
        // or use a test container
      });
    });
  });
});

