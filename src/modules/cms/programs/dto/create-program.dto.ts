/**
 * Create Program DTO (Data Transfer Object)
 * 
 * This file defines the data structure and validation rules for creating a new program.
 * DTOs are used to validate incoming request data before it reaches the service layer.
 * 
 * The class uses decorators from class-validator to enforce validation rules:
 * - Ensures required fields are present
 * - Validates data types and formats
 * - Enforces business rules (e.g., minimum duration)
 * 
 * This DTO is used when clients send POST requests to create new programs.
 */

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

/**
 * DTO for creating a new program.
 * All validation rules are enforced automatically by NestJS validation pipe.
 */
export class CreateProgramDto {
  /**
   * Program title - required string field.
   * Must be a non-empty string.
   */
  @IsString()
  @IsNotEmpty()
  title: string;

  /**
   * Program description - optional string field.
   * Can be omitted when creating a program.
   */
  @IsString()
  @IsOptional()
  description?: string;

  /**
   * Program category - required string field.
   * Must be a non-empty string (e.g., "Technology", "Science").
   */
  @IsString()
  @IsNotEmpty()
  category: string;

  /**
   * Program type - required enum field.
   * Must be either 'video_podcast' or 'documentary'.
   */
  @IsEnum(ProgramType)
  type: ProgramType;

  /**
   * Program language - optional enum field.
   * Defaults to Arabic if not provided.
   * Must be either 'ar' (Arabic) or 'en' (English).
   */
  @IsEnum(ProgramLanguage)
  @IsOptional()
  language?: ProgramLanguage;

  /**
   * Program duration in seconds - required integer field.
   * Must be a positive integer (minimum value: 1).
   */
  @IsInt()
  @Min(1)
  duration: number;

  /**
   * Publication date - required date string field.
   * Must be in ISO 8601 date format (e.g., "2024-01-15").
   * Will be converted to Date object in the service layer.
   */
  @IsDateString()
  publicationDate: string;
}

