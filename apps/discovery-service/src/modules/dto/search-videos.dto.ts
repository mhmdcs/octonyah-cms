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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VideoType } from '@octonyah/shared-videos';

export class SearchVideosDto {
  // Text search query - searches in title and description.
  // Optional - if not provided, returns all videos matching other filters
  @ApiPropertyOptional({
    description: 'Search query for title and description',
    example: 'technology',
  })
  @IsOptional()
  @IsString()
  q?: string;

  // Filter by video category. if not provided, includes all categories.
  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'Technology',
  })
  @IsOptional()
  @IsString()
  category?: string;

  // Filter by video type (video_podcast or documentary), if not provided, includes all types
  @ApiPropertyOptional({
    description: 'Filter by video type',
    enum: VideoType,
    example: VideoType.VIDEO_PODCAST,
  })
  @IsOptional()
  @IsEnum(VideoType)
  type?: VideoType;

  @ApiPropertyOptional({
    description: 'Filter by tags. Provide multiple tags by repeating the query param.',
    example: ['technology', 'documentary'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // Page number for pagination (1-based), Defaults to 1 if not provided
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  // Number of results per page.  Defaults to 20 if not provided. Maximum is 100 to prevent performance issues
  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  // Sort order for the results
  @ApiPropertyOptional({
    description: 'Sort order: relevance, date (newest first), or popular.',
    enum: ['relevance', 'date', 'popular'],
    default: 'relevance',
  })
  @IsOptional()
  @IsIn(['relevance', 'date', 'popular'])
  sort?: 'relevance' | 'date' | 'popular';

  // Only return videos published on or after this date (ISO string)
  @ApiPropertyOptional({
    description: 'Filter by publication date (start). ISO string.',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  // Only return videos published on or before this date (ISO string)
  @ApiPropertyOptional({
    description: 'Filter by publication date (end). ISO string.',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

