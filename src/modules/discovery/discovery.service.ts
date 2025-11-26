/**
 * Discovery Service
 * 
 * This file contains the business logic for the Discovery System.
 * It provides search and exploration functionality for programs,
 * allowing public users to find and browse content.
 * 
 * The service:
 * - Performs text search across program titles and descriptions
 * - Filters programs by category, type, and language
 * - Implements pagination for efficient data retrieval
 * - Returns programs ordered by publication date (newest first)
 * 
 * This service uses the ProgramsService to access program data,
 * maintaining separation of concerns between CMS and Discovery.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Program } from '../cms/programs/entities/program.entity';
import { SearchProgramsDto } from './dto/search-programs.dto';
import { SearchResponseDto } from './dto/search-response.dto';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
  ) {}

  /**
   * Searches and filters programs based on the provided criteria.
   * 
   * Supports:
   * - Text search in title and description
   * - Filtering by category, type, and language
   * - Pagination with configurable page size
   * 
   * Results are ordered by publication date (newest first).
   * 
   * @param searchDto - Search criteria and pagination parameters
   * @returns Search results with programs and pagination metadata
   */
  async searchPrograms(searchDto: SearchProgramsDto): Promise<SearchResponseDto> {
    const { q, category, type, language, page = 1, limit = 20 } = searchDto;

    // Build where conditions for filtering
    const where: FindOptionsWhere<Program> = {};

    // Text search in title and description
    if (q) {
      where.title = Like(`%${q}%`) as any;
      // Note: SQLite doesn't support OR in FindOptionsWhere easily,
      // so we'll handle this in the query builder
    }

    // Apply filters
    if (category) {
      where.category = category;
    }
    if (type) {
      where.type = type;
    }
    if (language) {
      where.language = language;
    }

    // Build query with text search support
    const queryBuilder = this.programRepository.createQueryBuilder('program');

    // Apply text search (searches in both title and description)
    if (q) {
      queryBuilder.where(
        '(program.title LIKE :search OR program.description LIKE :search)',
        { search: `%${q}%` },
      );
    }

    // Apply filters
    if (category) {
      queryBuilder.andWhere('program.category = :category', { category });
    }
    if (type) {
      queryBuilder.andWhere('program.type = :type', { type });
    }
    if (language) {
      queryBuilder.andWhere('program.language = :language', { language });
    }

    // Order by publication date (newest first)
    queryBuilder.orderBy('program.publicationDate', 'DESC');

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const programs = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      data: programs,
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * Gets a single program by ID for public viewing.
   * 
   * This is a public endpoint that doesn't require authentication.
   * It returns the same program data as the CMS, but through
   * the discovery/public interface.
   * 
   * @param id - UUID of the program to retrieve
   * @returns The program entity
   */
  async getProgram(id: string): Promise<Program> {
    const program = await this.programRepository.findOne({ where: { id } });
    if (!program) {
      throw new Error(`Program with ID ${id} not found`);
    }
    return program;
  }

  /**
   * Gets programs by category.
   * 
   * Useful for browsing programs by category without text search.
   * Results are paginated and ordered by publication date.
   * 
   * @param category - Category name to filter by
   * @param page - Page number (default: 1)
   * @param limit - Results per page (default: 20)
   * @returns Search results with programs and pagination metadata
   */
  async getProgramsByCategory(
    category: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResponseDto> {
    return this.searchPrograms({ category, page, limit });
  }

  /**
   * Gets programs by type (video_podcast or documentary).
   * 
   * Useful for browsing programs by type.
   * Results are paginated and ordered by publication date.
   * 
   * @param type - Program type to filter by
   * @param page - Page number (default: 1)
   * @param limit - Results per page (default: 20)
   * @returns Search results with programs and pagination metadata
   */
  async getProgramsByType(
    type: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResponseDto> {
    return this.searchPrograms({ type: type as any, page, limit });
  }
}

