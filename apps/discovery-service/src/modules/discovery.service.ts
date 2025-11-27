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
import { Repository } from 'typeorm';
import { Program } from '@octonyah/shared-programs';
import { SearchProgramsDto } from './dto/search-programs.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { RedisCacheService } from '../cache/redis-cache.service';
import {
  SEARCH_CACHE_PREFIX,
  buildProgramCacheKey,
} from '../cache/cache.constants';
import { ProgramSearchService } from '../search/program-search.service';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly cache: RedisCacheService,
    private readonly programSearch: ProgramSearchService,
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
  async searchPrograms(
    searchDto: SearchProgramsDto,
  ): Promise<SearchResponseDto> {
    const {
      q,
      category,
      type,
      language,
      tags,
      page = 1,
      limit = 20,
      sort,
      startDate,
      endDate,
    } = searchDto;

    const cacheKey = this.buildSearchCacheKey({
      q,
      category,
      type,
      language,
      tags,
      page,
      limit,
      sort,
      startDate,
      endDate,
    });

    const cached = await this.cache.get<SearchResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.programSearch.search({
      q,
      category,
      type,
      language,
      tags,
      page,
      limit,
      sort,
      startDate,
      endDate,
    });

    await this.cache.set(cacheKey, response);
    return response;
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
    const cacheKey = buildProgramCacheKey(id);
    const cached = await this.cache.get<Program>(cacheKey);
    if (cached) {
      return cached;
    }

    const program = await this.programRepository.findOne({ where: { id } });
    if (!program) {
      throw new Error(`Program with ID ${id} not found`);
    }

    await this.cache.set(cacheKey, program);
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
    return this.searchPrograms({
      type: type as Program['type'],
      page,
      limit,
    });
  }

  private buildSearchCacheKey(params: {
    q?: string;
    category?: string;
    type?: string;
    language?: string;
    tags?: string[];
    sort?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    limit: number;
  }) {
    const sortedTags = params.tags ? [...params.tags].sort() : [];
    const normalized = {
      q: params.q?.trim() ?? '',
      category: params.category?.trim() ?? '',
      type: params.type ?? '',
      language: params.language ?? '',
      tags: sortedTags.join(','),
      sort: params.sort ?? '',
      startDate: params.startDate ?? '',
      endDate: params.endDate ?? '',
      page: params.page,
      limit: params.limit,
    };

    const key = Object.values(normalized).join('|');
    return `${SEARCH_CACHE_PREFIX}:${key}`;
  }
}
