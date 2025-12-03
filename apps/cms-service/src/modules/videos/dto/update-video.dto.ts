import {
  IsString,
  IsEnum,
  IsDateString,
  IsOptional,
  IsArray,
} from 'class-validator';
import { VideoType } from '@octonyah/shared-videos';

/**
 * DTO for updating a video record.
 * All fields are optional for partial updates.
 */
export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(VideoType)
  type?: VideoType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsDateString()
  publicationDate?: string;
}
