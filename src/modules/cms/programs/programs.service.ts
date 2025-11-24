import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program, ProgramLanguage } from './entities/program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  async create(createProgramDto: CreateProgramDto): Promise<Program> {
    const program = this.programRepository.create({
      title: createProgramDto.title,
      description: createProgramDto.description,
      category: createProgramDto.category,
      type: createProgramDto.type,
      language: createProgramDto.language || ProgramLanguage.ARABIC,
      duration: createProgramDto.duration,
      publicationDate: new Date(createProgramDto.publicationDate),
    });
    return await this.programRepository.save(program);
  }

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
    if (updateProgramDto.publicationDate !== undefined) {
      updateData.publicationDate = new Date(updateProgramDto.publicationDate);
    }

    Object.assign(program, updateData);
    return await this.programRepository.save(program);
  }

  async remove(id: string): Promise<void> {
    const program = await this.findOne(id);
    await this.programRepository.remove(program);
  }
}

