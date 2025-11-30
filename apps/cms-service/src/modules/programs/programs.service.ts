import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program, ProgramLanguage } from '@octonyah/shared-programs';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramEventsPublisher } from '@octonyah/shared-events';
import { StorageService } from '@octonyah/shared-storage';

@Injectable()
export class ProgramsService {
  private readonly logger = new Logger(ProgramsService.name);

  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly programEventsPublisher: ProgramEventsPublisher,
    private readonly storageService: StorageService,
  ) {}

  async create(createProgramDto: CreateProgramDto): Promise<Program> {
    const program = this.programRepository.create({
      title: createProgramDto.title,
      description: createProgramDto.description,
      category: createProgramDto.category,
      type: createProgramDto.type,
      language: createProgramDto.language || ProgramLanguage.ARABIC,
      duration: createProgramDto.duration,
      tags: this.normalizeTags(createProgramDto.tags),
      popularityScore: createProgramDto.popularityScore ?? 0,
      // Convert date string to Date object
      publicationDate: new Date(createProgramDto.publicationDate),
      videoUrl: createProgramDto.videoUrl,
      thumbnailImageUrl: createProgramDto.thumbnailImageUrl,
    });
    const saved = await this.programRepository.save(program);
    this.programEventsPublisher.programCreated(saved);
    return saved;
  }

  // Returns programs ordered by publication date (newest first)
  // Array of all programs  ordered by publication date descending
  async findAll(): Promise<Program[]> {
    return await this.programRepository.find({
      order: { publicationDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Program> {
    const program = await this.programRepository.findOne({ where: { id } });
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
    return program;
  }

  async update(id: string, updateProgramDto: UpdateProgramDto): Promise<Program> {
    const program = await this.findOne(id);
    
    // Delete old video file if it's being replaced
    if (updateProgramDto.videoUrl !== undefined && program.videoUrl && program.videoUrl !== updateProgramDto.videoUrl) {
      try {
        await this.storageService.deleteFile(program.videoUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete old video file: ${program.videoUrl}`, error);
      }
    }
    
    // Delete old thumbnail file if it's being replaced
    if (updateProgramDto.thumbnailImageUrl !== undefined && program.thumbnailImageUrl && program.thumbnailImageUrl !== updateProgramDto.thumbnailImageUrl) {
      try {
        await this.storageService.deleteFile(program.thumbnailImageUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete old thumbnail file: ${program.thumbnailImageUrl}`, error);
      }
    }
    
    const updateData: Partial<Program> = {};
    if (updateProgramDto.title !== undefined) updateData.title = updateProgramDto.title;
    if (updateProgramDto.description !== undefined) updateData.description = updateProgramDto.description;
    if (updateProgramDto.category !== undefined) updateData.category = updateProgramDto.category;
    if (updateProgramDto.type !== undefined) updateData.type = updateProgramDto.type;
    if (updateProgramDto.language !== undefined) updateData.language = updateProgramDto.language;
    if (updateProgramDto.duration !== undefined) updateData.duration = updateProgramDto.duration;
    if (updateProgramDto.tags !== undefined) updateData.tags = this.normalizeTags(updateProgramDto.tags);
    if (updateProgramDto.popularityScore !== undefined) updateData.popularityScore = updateProgramDto.popularityScore;
    if (updateProgramDto.publicationDate !== undefined) updateData.publicationDate = new Date(updateProgramDto.publicationDate);
    if (updateProgramDto.videoUrl !== undefined) updateData.videoUrl = updateProgramDto.videoUrl;
    if (updateProgramDto.thumbnailImageUrl !== undefined) updateData.thumbnailImageUrl = updateProgramDto.thumbnailImageUrl;

    Object.assign(program, updateData);
    const updated = await this.programRepository.save(program);
    this.programEventsPublisher.programUpdated(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const program = await this.findOne(id);
    await this.deleteProgramMediaFiles(program);
    await this.programRepository.remove(program);
    this.programEventsPublisher.programDeleted({ id });
  }

  private async deleteProgramMediaFiles(program: Program): Promise<void> {
    if (program.videoUrl) {
      try {
        await this.storageService.deleteFile(program.videoUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete video file: ${program.videoUrl}`, error);
      }
    }

    if (program.thumbnailImageUrl) {
      try {
        await this.storageService.deleteFile(program.thumbnailImageUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete thumbnail file: ${program.thumbnailImageUrl}`, error);
      }
    }
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags) {
      return [];
    }
    return tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
}

