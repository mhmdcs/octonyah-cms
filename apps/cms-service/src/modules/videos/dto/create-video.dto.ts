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
import { VideoType, VideoLanguage } from '@octonyah/shared-videos';


export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(VideoType)
  type: VideoType;

  @IsEnum(VideoLanguage)
  @IsOptional()
  language?: VideoLanguage;

  @IsInt()
  @Min(1)
  duration: number;

  // Must be in ISO 8601 date format (e.g. "2024-01-15")
  @IsDateString()
  publicationDate: string;

  // Optional tags/keywords used for search filtering.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  // Optional popularity score (defaults to 0 if omitted).
  @IsOptional()
  @IsInt()
  @Min(0)
  popularityScore?: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailImageUrl?: string;
}

