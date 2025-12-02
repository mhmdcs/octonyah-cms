// Videos Service Test Suite
// Unit tests that verify that individual components work correctly in isolation

/**
 * Testing Strategy:
 * - Mock the TypeORM repository to avoid database dependencies
 * - Test each service method independently
 * - Verify both success and error scenarios
 * 
 * Test Structure:
 * - beforeEach: sets up test environment before each test
 * - describe blocks: group related tests together
 * - it blocks: individual test cases
 * - Mock functions: simulate repository behavior without real database
 */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoType, VideoLanguage } from '@octonyah/shared-videos';
import { NotFoundException } from '@nestjs/common';
import { VideosService } from './videos.service';
import { VideoEventsPublisher } from '@octonyah/shared-events';
import { VideoPlatformsService } from '@octonyah/shared-video-platforms';

// Groups all tests related to the VideosService class
describe('VideosService', () => {
  let service: VideosService;
  let repository: Repository<Video>;

  /**
   * Mock repository object that simulates TypeORM repository methods.
   * Uses Jest mock functions (jest.fn()) to track calls and return values.
   * This allows testing without a real database connection.
   */
  const mockRepository = {
    create: jest.fn(), // Mock function for creating entity instances
    save: jest.fn(),   // Mock function for saving to database
    find: jest.fn(),   // Mock function for finding multiple records
    findOne: jest.fn(), // Mock function for finding single record
    remove: jest.fn(), // Mock function for deleting records
  };

  /**
   * Setup function that runs before each test.
   * Creates a testing module with mocked dependencies.
   */
  beforeEach(async () => {
    // Create a NestJS testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          // Provide a mock repository instead of real TypeORM repository
          provide: getRepositoryToken(Video),
          useValue: mockRepository,
        },
        {
          provide: VideoEventsPublisher,
          useValue: {
            videoCreated: jest.fn(),
            videoUpdated: jest.fn(),
            videoDeleted: jest.fn(),
          },
        },
        {
          provide: VideoPlatformsService,
          useValue: {
            fetchMetadataFromUrl: jest.fn(),
          },
        },
      ],
    }).compile();

    // Get instances from the testing module
    service = module.get<VideosService>(VideosService);
    repository = module.get<Repository<Video>>(getRepositoryToken(Video));
  });

  /**
   * Basic test to verify the service is properly instantiated.
   * This is a sanity check to ensure the test setup is correct.
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * Test suite for the create method.
   * Tests video creation functionality.
   */
  describe('create', () => {
    /**
     * Test that verifies a video can be created successfully.
     * 
     * Steps:
     * 1. Prepare test data (CreateVideoDto)
     * 2. Mock repository responses
     * 3. Call the service method
     * 4. Assert the result matches expected output
     * 5. Verify repository methods were called correctly
     */
    it('should create a video', async () => {
      // Test data that would come from a client request
      const createDto = {
        title: 'Test Video',
        description: 'Test Description',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
        language: VideoLanguage.ARABIC,
        duration: 3600,
        publicationDate: '2024-01-01',
        tags: ['tech', 'podcast'],
        popularityScore: 5,
      };

      // Expected video entity after creation (with generated fields)
      const video = {
        id: '1',
        ...createDto,
        publicationDate: new Date(createDto.publicationDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configure mock repository to return expected values
      mockRepository.create.mockReturnValue(video);
      mockRepository.save.mockResolvedValue(video);

      // Execute the service method
      const result = await service.create(createDto);

      // Assertions: verify the result and that methods were called
      expect(result).toEqual(video);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  /**
   * Test suite for the findOne method.
   * Tests video retrieval functionality.
   */
  describe('findOne', () => {
    /**
     * Test that verifies a video can be retrieved by ID.
     * 
     * Steps:
     * 1. Prepare a mock video
     * 2. Configure repository to return it
     * 3. Call the service method
     * 4. Assert the returned video matches expected data
     */
    it('should return a video', async () => {
      // Mock video data
      const video = {
        id: '1',
        title: 'Test Video',
        description: 'Test Description',
        category: 'Technology',
        type: VideoType.VIDEO_PODCAST,
        language: VideoLanguage.ARABIC,
        duration: 3600,
        tags: ['tech'],
        popularityScore: 10,
        publicationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Configure mock to return the video
      mockRepository.findOne.mockResolvedValue(video);

      // Execute and verify
      const result = await service.findOne('1');
      expect(result).toEqual(video);
    });

    /**
     * Test that verifies proper error handling when video is not found.
     * 
     * This is a negative test case that ensures the service throws
     * NotFoundException when a video doesn't exist, which is the
     * expected behavior for a REST API.
     */
    it('should throw NotFoundException if video not found', async () => {
      // Configure mock to return null (not found)
      mockRepository.findOne.mockResolvedValue(null);

      // Verify that the service throws the expected exception
      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});

