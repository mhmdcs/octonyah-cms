import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  IsIn,
  IsDateString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VideoType } from '@octonyah/shared-videos';

/**
 * DTO for video search queries with filtering and pagination.
 */
export class SearchVideosDto {
  /**
   * Text search query - searches in title and description.
   * Optional - if not provided, returns all videos matching other filters.
   */
  @IsOptional()
  @IsString()
  q?: string;

  /**
   * Filter by video category. If not provided, includes all categories.
   */
  @IsOptional()
  @IsString()
  category?: string;

  /**
   * Filter by video type (video_podcast or documentary).
   * If not provided, includes all types.
   */
  @IsOptional()
  @IsEnum(VideoType)
  type?: VideoType;

  /**
   * Filter by tags. Videos must contain ALL specified tags.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  /**
   * Page number for pagination (1-based).
   * Defaults to 1 if not provided.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Number of results per page.
   * Defaults to 20 if not provided. Maximum is 100.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  /**
   * Sort order for the results:
   * - relevance: Best matches first (default when q is provided)
   * - date: Newest videos first
   */
  @IsOptional()
  @IsIn(['relevance', 'date'])
  sort?: 'relevance' | 'date';

  /**
   * Only return videos published on or after this date (ISO string).
   */
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * Only return videos published on or before this date (ISO string).
   */
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
