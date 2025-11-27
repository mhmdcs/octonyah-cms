import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import {
  Program,
  ProgramLanguage,
  ProgramType,
} from '@octonyah/shared-programs';
import { SearchProgramsDto } from '../modules/dto/search-programs.dto';
import { SearchResponseDto } from '../modules/dto/search-response.dto';
import { ProgramSearchDocument } from './program-search.types';

@Injectable()
export class ProgramSearchService implements OnModuleInit {
  private readonly logger = new Logger(ProgramSearchService.name);
  private readonly indexName: string;

  constructor(
    private readonly esService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {
    this.indexName = this.configService.get<string>(
      'ELASTICSEARCH_INDEX',
      'programs',
    );
  }

  async onModuleInit(): Promise<void> {
    await this.ensureIndex();
  }

  private async ensureIndex() {
    try {
      const existsResponse = await this.esService.indices.exists({
        index: this.indexName,
      });
      const indexExists =
        typeof existsResponse === 'boolean'
          ? existsResponse
          : (existsResponse as { body: boolean }).body;

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
            },
          },
        });

        this.logger.log(`Created Elasticsearch index ${this.indexName}`);
      }
    } catch (error) {
      this.logger.error('Failed to ensure Elasticsearch index', error);
    }
  }

  async search(dto: SearchProgramsDto): Promise<SearchResponseDto> {
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
    if (tags && tags.length > 0) {
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
        must: must.length ? must : [{ match_all: {} }],
        filter,
      },
    };

    const sortClause = this.buildSort(sort);

    try {
      const response = await this.esService.search<ProgramSearchDocument>({
        index: this.indexName,
        from,
        size: limit,
        query,
        sort: sortClause,
      });

      const total: number =
        typeof response.hits.total === 'number'
          ? response.hits.total
          : (response.hits.total?.value ?? 0);

      const data = response.hits.hits
        .map((hit) => this.toProgram(hit._source))
        .filter((program): program is Program => !!program);

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

  async indexProgram(program: Partial<Program>): Promise<void> {
    if (!program.id) {
      return;
    }

    const document = this.serializeProgram(program);
    try {
      await this.esService.index({
        index: this.indexName,
        id: document.id,
        document,
      });
      await this.esService.indices.refresh({ index: this.indexName });
    } catch (error) {
      this.logger.error(`Failed to index program ${program.id}`, error);
    }
  }

  async removeProgram(id?: string): Promise<void> {
    if (!id) return;
    try {
      await this.esService.delete({
        index: this.indexName,
        id,
      });
    } catch (error) {
      const statusCode = (error as { meta?: { statusCode?: number } })?.meta
        ?.statusCode;
      if (statusCode === 404) {
        return;
      }
      this.logger.error(`Failed to remove program ${id}`, error);
    }
  }

  private serializeProgram(program: Partial<Program>): ProgramSearchDocument {
    return {
      id: program.id as string,
      title: program.title ?? '',
      description: program.description,
      category: program.category ?? '',
      type: program.type ?? ProgramType.VIDEO_PODCAST,
      language: program.language ?? ProgramLanguage.ARABIC,
      tags: program.tags ?? [],
      duration: program.duration ?? 0,
      popularityScore: program.popularityScore ?? 0,
      publicationDate:
        this.toIso(program.publicationDate) ?? new Date().toISOString(),
      createdAt: this.toIso(program.createdAt),
      updatedAt: this.toIso(program.updatedAt),
    };
  }

  private toProgram(doc?: ProgramSearchDocument): Program | null {
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
    } as Program;
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
