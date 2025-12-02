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
  async searchVideos(searchDto: SearchVideosDto): Promise<SearchResponseDto> {
    const cacheKey = this.buildSearchCacheKey(searchDto);
    const cached = await this.cache.get<SearchResponseDto>(cacheKey);
    if (cached) return cached;

    const response = await this.videoSearch.search(searchDto);
    await this.cache.set(cacheKey, response);
    return response;
  }

  async getVideo(id: string): Promise<Video> {
    const cacheKey = buildVideoCacheKey(id);
    const cached = await this.cache.get<Video>(cacheKey);
    if (cached) return cached;

    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) throw new Error(`Video with ID ${id} not found`);

    await this.cache.set(cacheKey, video);
    return video;
  }

  async getVideosByCategory(category: string, page = 1, limit = 20): Promise<SearchResponseDto> {
    return this.searchVideos({ category, page, limit });
  }

  async getVideosByType(type: string, page = 1, limit = 20): Promise<SearchResponseDto> {
    return this.searchVideos({ type: type as Video['type'], page, limit });
  }

  private buildSearchCacheKey(params: SearchVideosDto) {
    const { q, category, type, language, tags, sort, startDate, endDate, page, limit } = params;
    const parts = [
      q?.trim() ?? '', category?.trim() ?? '', type ?? '', language ?? '',
      (tags ? [...tags].sort() : []).join(','), sort ?? '',
      startDate ?? '', endDate ?? '', page, limit,
    ];
    return `${SEARCH_CACHE_PREFIX}:${parts.join('|')}`;
  }
}
