import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from '@octonyah/shared-programs';
import { SearchProgramsDto } from './dto/search-programs.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { RedisCacheService, SEARCH_CACHE_PREFIX, buildProgramCacheKey } from '@octonyah/shared-cache';
import { ProgramSearchService } from '../search/program-search.service';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(Program)
    private readonly programRepository: Repository<Program>,
    private readonly cache: RedisCacheService,
    private readonly programSearch: ProgramSearchService,
  ) {}

  // Text search in title and description, Filtering by category, type, and language, 
  // Pagination with configurable page size
  // Results ordered by publication date (newest first)
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

  // Gets programs by category
  // Useful for browsing programs by category without text search
  // Results are paginated and ordered by publication date
  async getProgramsByCategory(
    category: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResponseDto> {
    return this.searchPrograms({ category, page, limit });
  }

  // Gets programs by type (video_podcast or documentary)
  // Useful for browsing programs by type, and results are paginated and ordered by publication date
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
