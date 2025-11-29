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
import { ProgramType, ProgramLanguage } from '@octonyah/shared-programs';


export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsEnum(ProgramType)
  type: ProgramType;

  @IsEnum(ProgramLanguage)
  @IsOptional()
  language?: ProgramLanguage;

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
}

