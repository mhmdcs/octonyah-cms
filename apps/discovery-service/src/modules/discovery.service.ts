import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video } from '@octonyah/shared-videos';
import { SearchVideosDto } from './dto/search-videos.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { RedisCacheService, SEARCH_CACHE_PREFIX, buildVideoCacheKey } from '@octonyah/shared-cache';
import { VideoSearchService } from '../search/video-search.service';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly cache: RedisCacheService,
    private readonly videoSearch: VideoSearchService,
  ) {}

  // Text search in title and description, Filtering by category, type, and language, 
  // Pagination with configurable page size
  // Results ordered by publication date (newest first)
  async searchVideos(
    searchDto: SearchVideosDto,
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

    const response = await this.videoSearch.search({
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

  async getVideo(id: string): Promise<Video> {
    const cacheKey = buildVideoCacheKey(id);
    const cached = await this.cache.get<Video>(cacheKey);
    if (cached) {
      return cached;
    }

    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) {
      throw new Error(`Video with ID ${id} not found`);
    }

    await this.cache.set(cacheKey, video);
    return video;
  }

  // Gets videos by category
  // Useful for browsing videos by category without text search
  // Results are paginated and ordered by publication date
  async getVideosByCategory(
    category: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResponseDto> {
    return this.searchVideos({ category, page, limit });
  }

  // Gets videos by type (video_podcast or documentary)
  // Useful for browsing videos by type, and results are paginated and ordered by publication date
  async getVideosByType(
    type: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<SearchResponseDto> {
    return this.searchVideos({
      type: type as Video['type'],
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
