import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsDateString,
  IsOptional,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VideoType, VideoLanguage, VideoPlatform } from '@octonyah/shared-videos';

/**
 * DTO for creating a video record manually.
 * Use ImportVideoDto for importing from external platforms.
 */
export class CreateVideoDto {
  @ApiProperty({ description: 'Video title', example: 'Introduction to NestJS' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Video description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Video category', example: 'Technology' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Type of video', enum: VideoType })
  @IsEnum(VideoType)
  type: VideoType;

  @ApiPropertyOptional({ description: 'Video language', enum: VideoLanguage })
  @IsEnum(VideoLanguage)
  @IsOptional()
  language?: VideoLanguage;

  @ApiProperty({ description: 'Duration in seconds', example: 600 })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({
    description: 'Publication date in ISO 8601 format',
    example: '2024-01-15',
  })
  @IsDateString()
  publicationDate: string;

  @ApiPropertyOptional({
    description: 'Tags/keywords for search filtering',
    example: ['nestjs', 'typescript', 'backend'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Popularity score', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  popularityScore?: number;

  @ApiPropertyOptional({ description: 'URL to the video file or external video' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'Thumbnail URL from source platform (e.g., YouTube thumbnail URL)',
  })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Source platform of the video',
    enum: VideoPlatform,
    default: VideoPlatform.NATIVE,
  })
  @IsOptional()
  @IsEnum(VideoPlatform)
  platform?: VideoPlatform;

  @ApiPropertyOptional({
    description: 'Video ID on the external platform (e.g., YouTube video ID)',
  })
  @IsOptional()
  @IsString()
  platformVideoId?: string;

  @ApiPropertyOptional({ description: 'Embeddable URL for the video' })
  @IsOptional()
  @IsString()
  embedUrl?: string;

}

