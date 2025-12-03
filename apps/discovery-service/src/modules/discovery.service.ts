import { Injectable, NotFoundException } from '@nestjs/common';
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

  async searchVideos(dto: SearchVideosDto): Promise<SearchResponseDto> {
    return this.withCache(this.buildSearchCacheKey(dto), () => this.videoSearch.search(dto));
  }

  async getVideo(id: string): Promise<Video> {
    return this.withCache(buildVideoCacheKey(id), () => this.findVideoOrFail(id));
  }

  async getVideosByCategory(category: string, page = 1, limit = 20): Promise<SearchResponseDto> {
    return this.searchVideos({ category, page, limit });
  }

  async getVideosByType(type: string, page = 1, limit = 20): Promise<SearchResponseDto> {
    return this.searchVideos({ type: type as Video['type'], page, limit });
  }

  private async findVideoOrFail(id: string): Promise<Video> {
    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) throw new NotFoundException(`Video with ID ${id} not found`);
    return video;
  }

  private async withCache<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached) return cached;

    const result = await fetchFn();
    await this.cache.set(key, result);
    return result;
  }

  private buildSearchCacheKey(params: SearchVideosDto): string {
    const { q, category, type, tags, sort, startDate, endDate, page, limit } = params;
    const parts = [
      q?.trim() ?? '',
      category?.trim() ?? '',
      type ?? '',
      (tags ? [...tags].sort() : []).join(','),
      sort ?? '',
      startDate ?? '',
      endDate ?? '',
      page,
      limit,
    ];
    return `${SEARCH_CACHE_PREFIX}:${parts.join('|')}`;
  }
}
