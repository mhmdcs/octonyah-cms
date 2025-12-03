import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VideoType } from '@octonyah/shared-videos';

/**
 * DTO for updating a video record.
 * All fields are optional for partial updates.
 */
export class UpdateVideoDto {
  @ApiPropertyOptional({ description: 'Video title', example: 'Updated Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Video description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Video category', example: 'Technology' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Type of video', enum: VideoType })
  @IsOptional()
  @IsEnum(VideoType)
  type?: VideoType;

  @ApiPropertyOptional({
    description: 'Tags/keywords for search filtering',
    example: ['nestjs', 'typescript', 'backend'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Publication date in ISO 8601 format',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  publicationDate?: string;
}
