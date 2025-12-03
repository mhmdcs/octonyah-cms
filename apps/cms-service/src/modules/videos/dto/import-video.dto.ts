import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
} from 'class-validator';
import { VideoType } from '@octonyah/shared-videos';

/**
 * DTO for importing a video from an external platform (e.g., YouTube).
 * The service will automatically extract metadata from the platform API.
 * Optional fields allow overriding the extracted metadata.
 */
export class ImportVideoDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(VideoType)
  type: VideoType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
