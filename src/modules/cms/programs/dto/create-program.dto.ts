import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  IsDateString,
  IsOptional,
  Min,
} from 'class-validator';
import { ProgramType, ProgramLanguage } from '../entities/program.entity';

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

  @IsDateString()
  publicationDate: string;
}

