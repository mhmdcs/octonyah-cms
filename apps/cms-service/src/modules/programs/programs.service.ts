/**
 * Programs Service
 * 
 * This file contains the business logic for managing programs.
 * Services in NestJS handle the core application logic, separate from
 * HTTP concerns (which are handled by controllers).
 * 
 * This service provides CRUD operations (Create, Read, Update, Delete) for programs:
 * - Creating new programs with validated data
 * - Retrieving programs (all or by ID)
 * - Updating existing programs
 * - Deleting programs
 * 
 * It uses TypeORM repository pattern to interact with the database,
 * and includes error handling (e.g., NotFoundException for missing programs).
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program, ProgramLanguage } from '@octonyah/shared-programs';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { ProgramEventsPublisher } from './program-events.publisher';

/**
 * Service class for program management operations.
 * Injected with TypeORM repository for database access.
 */
@Injectable()
export class ProgramsService {
  /**
   * Constructor injects the TypeORM repository for Program entity.
   * This allows the service to perform database operations.
   */
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly programEventsPublisher: ProgramEventsPublisher,
  ) {}

  /**
   * Creates a new program in the database.
   * 
   * Converts the DTO (which has publicationDate as string) to a Program entity
   * (which requires publicationDate as Date). Sets default language to Arabic
   * if not provided.
   * 
   * @param createProgramDto - Validated data for creating a program
   * @returns The newly created program with generated ID and timestamps
   */
  async create(createProgramDto: CreateProgramDto): Promise<Program> {
    // Create a new program entity instance from the DTO
    const program = this.programRepository.create({
      title: createProgramDto.title,
      description: createProgramDto.description,
      category: createProgramDto.category,
      type: createProgramDto.type,
      // Default to Arabic if language not specified
      language: createProgramDto.language || ProgramLanguage.ARABIC,
      duration: createProgramDto.duration,
      tags: this.normalizeTags(createProgramDto.tags),
      popularityScore: createProgramDto.popularityScore ?? 0,
      // Convert date string to Date object
      publicationDate: new Date(createProgramDto.publicationDate),
    });
    // Save to database and return the saved entity (with generated ID)
    const saved = await this.programRepository.save(program);
    this.programEventsPublisher.programCreated(saved);
    return saved;
  }

  /**
   * Retrieves all programs from the database.
   * 
   * Returns programs ordered by publication date (newest first).
   * 
   * @returns Array of all programs, ordered by publication date descending
   */
  async findAll(): Promise<Program[]> {
    return await this.programRepository.find({
      order: { publicationDate: 'DESC' },
    });
  }

  /**
   * Retrieves a single program by its ID.
   * 
   * Throws NotFoundException if the program doesn't exist.
   * 
   * @param id - UUID of the program to retrieve
   * @returns The program entity if found
   * @throws NotFoundException if program with given ID doesn't exist
   */
  async findOne(id: string): Promise<Program> {
    const program = await this.programRepository.findOne({ where: { id } });
    if (!program) {
      throw new NotFoundException(`Program with ID ${id} not found`);
    }
    return program;
  }

  /**
   * Updates an existing program with new data.
   * 
   * Only updates fields that are provided in the DTO (partial update).
   * First retrieves the program (which throws if not found), then applies
   * only the provided updates, and saves the changes.
   * 
   * @param id - UUID of the program to update
   * @param updateProgramDto - Partial data to update (all fields optional)
   * @returns The updated program entity
   * @throws NotFoundException if program with given ID doesn't exist
   */
  async update(id: string, updateProgramDto: UpdateProgramDto): Promise<Program> {
    // This will throw NotFoundException if program doesn't exist
    const program = await this.findOne(id);
    
    // Build update object with only provided fields
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
      // Convert date string to Date object if provided
      updateData.publicationDate = new Date(updateProgramDto.publicationDate);
    }

    // Apply updates to the existing program entity
    Object.assign(program, updateData);
    // Save changes to database
    const updated = await this.programRepository.save(program);
    this.programEventsPublisher.programUpdated(updated);
    return updated;
  }

  /**
   * Deletes a program from the database.
   * 
   * First retrieves the program (which throws if not found), then removes it.
   * 
   * @param id - UUID of the program to delete
   * @throws NotFoundException if program with given ID doesn't exist
   */
  async remove(id: string): Promise<void> {
    // This will throw NotFoundException if program doesn't exist
    const program = await this.findOne(id);
    // Remove from database
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

