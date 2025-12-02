import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  Video,
  VideoLanguage,
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
      const indexExists = await this.esService.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.esService.indices.create({
          index: this.indexName,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              title: { type: 'search_as_you_type' },
              description: { type: 'text' },
              category: { type: 'keyword' },
              type: { type: 'keyword' },
              language: { type: 'keyword' },
              tags: { type: 'keyword' },
              duration: { type: 'integer' },
              popularityScore: { type: 'integer' },
              publicationDate: { type: 'date' },
              createdAt: { type: 'date' },
              updatedAt: { type: 'date' },
              deletedAt: { type: 'date' },
              // Media URLs (not indexed, just stored)
              videoUrl: { type: 'keyword', index: false },
              thumbnailUrl: { type: 'keyword', index: false },
              // Platform-related fields
              platform: { type: 'keyword' },
              platformVideoId: { type: 'keyword' },
              embedUrl: { type: 'keyword', index: false },
            },
          },
        });

        this.logger.log(`Created Elasticsearch index ${this.indexName}`);
      }
    } catch (error) {
      this.logger.error('Failed to ensure Elasticsearch index', error);
    }
  }

  async search(dto: SearchVideosDto): Promise<SearchResponseDto> {
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
    } = dto;

    const from = (page - 1) * limit;

    const must: any[] = [];
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ['title^3', 'description', 'tags'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    const filter: any[] = [];
    if (category) filter.push({ term: { category } });
    if (type) filter.push({ term: { type } });
    if (language) filter.push({ term: { language } });
    if (tags?.length) {
      filter.push({ terms: { tags } });
    }
    if (startDate || endDate) {
      const range: Record<string, string> = {};
      if (startDate) range.gte = startDate;
      if (endDate) range.lte = endDate;
      filter.push({ range: { publicationDate: range } });
    }

    const query: Record<string, any> = {
      bool: {
        must,
        filter,
      },
    };

    const sortClause = this.buildSort(sort);

    try {
      const response = await this.esService.search<VideoSearchDocument>({
        index: this.indexName,
        from,
        size: limit,
        query,
        sort: sortClause,
      });

      const total = (response.hits.total as SearchTotalHits).value;

      const data = response.hits.hits
        .map((hit) => this.toVideo(hit._source))
        .filter((video): video is Video => !!video);

      const totalPages = Math.ceil(total / limit) || 1;

      return {
        data,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      this.logger.error('Elasticsearch search failed', error);
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      };
    }
  }

  async indexVideo(video: Partial<Video>): Promise<void> {
    if (!video.id) {
      return;
    }

    const document = this.serializeVideo(video);
    try {
      await this.esService.index({
        index: this.indexName,
        id: document.id,
        document,
      });
      await this.esService.indices.refresh({ index: this.indexName });
    } catch (error) {
      this.logger.error(`Failed to index video ${video.id}`, error);
    }
  }

  async removeVideo(id: string): Promise<void> {
    try {
      await this.esService.delete({
        index: this.indexName,
        id,
      });
    } catch (error) {
      if (error instanceof errors.ResponseError) {
        if (error.statusCode === 404) return;
      }
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
      language: video.language ?? VideoLanguage.ARABIC,
      tags: video.tags ?? [],
      duration: video.duration ?? 0,
      popularityScore: video.popularityScore ?? 0,
      publicationDate:
        this.toIso(video.publicationDate) ?? new Date().toISOString(),
      createdAt: this.toIso(video.createdAt),
      updatedAt: this.toIso(video.updatedAt),
      deletedAt: this.toIso(video.deletedAt),
      // Media URLs
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      // Platform-related fields
      platform: video.platform ?? VideoPlatform.NATIVE,
      platformVideoId: video.platformVideoId,
      embedUrl: video.embedUrl,
    };
  }

  private toVideo(doc?: VideoSearchDocument): Video | null {
    if (!doc) {
      return null;
    }

    return {
      id: doc.id,
      title: doc.title,
      description: doc.description ?? null,
      category: doc.category,
      type: doc.type,
      language: doc.language,
      tags: doc.tags ?? [],
      duration: doc.duration,
      popularityScore: doc.popularityScore ?? 0,
      publicationDate: doc.publicationDate
        ? new Date(doc.publicationDate)
        : undefined,
      createdAt: doc.createdAt ? new Date(doc.createdAt) : undefined,
      updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : undefined,
      // Media URLs
      videoUrl: doc.videoUrl,
      thumbnailUrl: doc.thumbnailUrl,
      // Platform-related fields
      platform: doc.platform ?? VideoPlatform.NATIVE,
      platformVideoId: doc.platformVideoId,
      embedUrl: doc.embedUrl,
    } as Video;
  }

  private toIso(value?: Date | string): string | undefined {
    if (!value) return undefined;
    return value instanceof Date ? value.toISOString() : value;
  }

  private buildSort(sort?: string) {
    if (sort === 'date') {
      return ['publicationDate:desc'];
    }
    if (sort === 'popular') {
      return ['popularityScore:desc'];
    }
    return undefined; // relevance by score
  }
}
