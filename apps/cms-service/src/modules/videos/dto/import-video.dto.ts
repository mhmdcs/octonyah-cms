import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VideoType } from '@octonyah/shared-videos';

/**
 * DTO for importing a video from an external platform (e.g., YouTube).
 * The service will automatically extract metadata from the platform API.
 * Optional fields allow overriding the extracted metadata.
 */
export class ImportVideoDto {
  @ApiProperty({
    description: 'URL of the video to import (e.g., YouTube URL)',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Category for the video',
    example: 'Technology',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Type of video content',
    enum: VideoType,
    example: VideoType.VIDEO_PODCAST,
  })
  @IsEnum(VideoType)
  type: VideoType;

  @ApiPropertyOptional({
    description: 'Override the title extracted from the platform',
    example: 'Custom Video Title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Override the description extracted from the platform',
    example: 'Custom description for the video',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Additional tags for search and filtering (merged with platform tags)',
    example: ['podcast', 'interview', 'tech'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

