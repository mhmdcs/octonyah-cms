import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramsService } from './programs.service';
import { Program, ProgramType, ProgramLanguage } from './entities/program.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProgramsService', () => {
  let service: ProgramsService;
  let repository: Repository<Program>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        {
          provide: getRepositoryToken(Program),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
    repository = module.get<Repository<Program>>(getRepositoryToken(Program));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a program', async () => {
      const createDto = {
        title: 'Test Program',
        description: 'Test Description',
        category: 'Technology',
        type: ProgramType.VIDEO_PODCAST,
        language: ProgramLanguage.ARABIC,
        duration: 3600,
        publicationDate: '2024-01-01',
      };

      const program = {
        id: '1',
        ...createDto,
        publicationDate: new Date(createDto.publicationDate),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.create.mockReturnValue(program);
      mockRepository.save.mockResolvedValue(program);

      const result = await service.create(createDto);

      expect(result).toEqual(program);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a program', async () => {
      const program = {
        id: '1',
        title: 'Test Program',
        description: 'Test Description',
        category: 'Technology',
        type: ProgramType.VIDEO_PODCAST,
        language: ProgramLanguage.ARABIC,
        duration: 3600,
        publicationDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(program);

      const result = await service.findOne('1');

      expect(result).toEqual(program);
    });

    it('should throw NotFoundException if program not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});

