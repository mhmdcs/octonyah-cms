import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  Video,
  VideoType,
  VideoPlatform,
} from '@octonyah/shared-videos';
import { SearchVideosDto } from '../modules/dto/search-videos.dto';
import { SearchResponseDto } from '../modules/dto/search-response.dto';
import { VideoSearchDocument } from './video-search.types';
import { SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';
import { errors } from '@elastic/elasticsearch';

@Injectable()
export class VideoSearchService implements OnModuleInit {
  private readonly logger = new Logger(VideoSearchService.name);
  private readonly indexName: string;

  constructor(
    private readonly esService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {
    this.indexName = this.configService.get<string>(
      'ELASTICSEARCH_INDEX',
      'videos',
    );
  }

  async onModuleInit(): Promise<void> {
    await this.ensureIndex();
  }

  private async ensureIndex() {
    try {
      if (await this.esService.indices.exists({ index: this.indexName })) return;
      await this.esService.indices.create({
        index: this.indexName,
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { type: 'search_as_you_type' },
            description: { type: 'text' },
            category: { type: 'keyword' },
            type: { type: 'keyword' },
            tags: { type: 'keyword' },
            duration: { type: 'integer' },
            publicationDate: { type: 'date' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
            deletedAt: { type: 'date' },
            videoUrl: { type: 'keyword', index: false },
            thumbnailUrl: { type: 'keyword', index: false },
            platform: { type: 'keyword' },
            platformVideoId: { type: 'keyword' },
            embedUrl: { type: 'keyword', index: false },
          },
        },
      });
      this.logger.log(`Created Elasticsearch index ${this.indexName}`);
    } catch (error) {
      this.logger.error('Failed to ensure Elasticsearch index', error);
    }
  }

  async search(dto: SearchVideosDto): Promise<SearchResponseDto> {
    const { page = 1, limit = 20, sort } = dto;

    const query = {
      bool: {
        must: this.buildMustClause(dto),
        filter: this.buildFilterClause(dto),
      },
    };

    try {
      const response = await this.esService.search<VideoSearchDocument>({
        index: this.indexName,
        from: (page - 1) * limit,
        size: limit,
        query,
        sort: this.buildSort(sort),
      });
      return this.buildSearchResponse(response, page, limit);
    } catch (error) {
      this.logger.error('Elasticsearch search failed', error);
      return this.emptySearchResponse(page, limit);
    }
  }

  private emptySearchResponse(page: number, limit: number): SearchResponseDto {
    return { data: [], total: 0, page, limit, totalPages: 0, hasNext: false, hasPrev: false };
  }

  private buildMustClause({ q }: SearchVideosDto): any[] {
    if (!q) return [];
    return [{ multi_match: { query: q, fields: ['title^3', 'description', 'tags'], type: 'best_fields', fuzziness: 'AUTO' } }];
  }

  private buildFilterClause({ category, type, tags, startDate, endDate }: SearchVideosDto): any[] {
    const filter: any[] = [];
    if (category) filter.push({ term: { category } });
    if (type) filter.push({ term: { type } });
    if (tags?.length) filter.push({ terms: { tags } });
    if (startDate || endDate) {
      const range: Record<string, string> = {};
      if (startDate) range.gte = startDate;
      if (endDate) range.lte = endDate;
      filter.push({ range: { publicationDate: range } });
    }
    return filter;
  }

  private buildSearchResponse(response: any, page: number, limit: number): SearchResponseDto {
    const total = (response.hits.total as SearchTotalHits).value;
    const totalPages = Math.ceil(total / limit) || 1;

    const data = response.hits.hits
      .map((hit: any) => this.toVideo(hit._source))
      .filter((video: Video | null): video is Video => video !== null);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async indexVideo(video: Partial<Video>): Promise<void> {
    if (!video.id) return;
    try {
      const document = this.serializeVideo(video);
      await this.esService.index({ index: this.indexName, id: document.id, document });
      await this.esService.indices.refresh({ index: this.indexName });
    } catch (error) {
      this.logger.error(`Failed to index video ${video.id}`, error);
    }
  }

  async removeVideo(id: string): Promise<void> {
    try {
      await this.esService.delete({ index: this.indexName, id });
    } catch (error) {
      if (error instanceof errors.ResponseError && error.statusCode === 404) return;
      this.logger.error(`Failed to remove video ${id}`, error);
    }
  }

  private serializeVideo(video: Partial<Video>): VideoSearchDocument {
    return {
      id: video.id as string,
      title: video.title ?? '',
      description: video.description,
      category: video.category ?? '',
      type: video.type ?? VideoType.VIDEO_PODCAST,
      tags: video.tags ?? [],
      duration: video.duration ?? 0,
      publicationDate: this.toIso(video.publicationDate) ?? new Date().toISOString(),
      createdAt: this.toIso(video.createdAt),
      updatedAt: this.toIso(video.updatedAt),
      deletedAt: this.toIso(video.deletedAt),
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      platform: video.platform ?? VideoPlatform.NATIVE,
      platformVideoId: video.platformVideoId,
      embedUrl: video.embedUrl,
    };
  }

  private toVideo(doc?: VideoSearchDocument): Video | null {
    if (!doc) return null;

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description ?? null,
      category: doc.category,
      type: doc.type,
      tags: doc.tags ?? [],
      duration: doc.duration,
      publicationDate: this.parseDate(doc.publicationDate),
      createdAt: this.parseDate(doc.createdAt),
      updatedAt: this.parseDate(doc.updatedAt),
      videoUrl: doc.videoUrl,
      thumbnailUrl: doc.thumbnailUrl,
      platform: doc.platform ?? VideoPlatform.NATIVE,
      platformVideoId: doc.platformVideoId,
      embedUrl: doc.embedUrl,
    } as Video;
  }

  private parseDate(value?: string): Date | undefined {
    return value ? new Date(value) : undefined;
  }

  private toIso(value?: Date | string): string | undefined {
    return value instanceof Date ? value.toISOString() : value;
  }

  private buildSort(sort?: string) {
    const sortMap: Record<string, string[]> = {
      date: ['publicationDate:desc'],
    };
    return sort ? sortMap[sort] : undefined;
  }
}
