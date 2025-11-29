import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program, ProgramLanguage } from '@octonyah/shared-programs';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramEventsPublisher } from './program-events.publisher';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly programEventsPublisher: ProgramEventsPublisher,
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
    
    const updateData: Partial<Program> = {};
    if (updateProgramDto.title !== undefined) updateData.title = updateProgramDto.title;
    if (updateProgramDto.description !== undefined) updateData.description = updateProgramDto.description;
    if (updateProgramDto.category !== undefined) updateData.category = updateProgramDto.category;
    if (updateProgramDto.type !== undefined) updateData.type = updateProgramDto.type;
    if (updateProgramDto.language !== undefined) updateData.language = updateProgramDto.language;
    if (updateProgramDto.duration !== undefined) updateData.duration = updateProgramDto.duration;
    if (updateProgramDto.tags !== undefined) {
      updateData.tags = this.normalizeTags(updateProgramDto.tags);
    }
    if (updateProgramDto.popularityScore !== undefined) {
      updateData.popularityScore = updateProgramDto.popularityScore;
    }
    if (updateProgramDto.publicationDate !== undefined) {
      updateData.publicationDate = new Date(updateProgramDto.publicationDate);
    }

    Object.assign(program, updateData);
    const updated = await this.programRepository.save(program);
    this.programEventsPublisher.programUpdated(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const program = await this.findOne(id);
    await this.programRepository.remove(program);
    this.programEventsPublisher.programDeleted({ id });
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

