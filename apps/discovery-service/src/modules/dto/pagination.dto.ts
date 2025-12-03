import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Reusable DTO for pagination query parameters.
 * Works with the global ValidationPipe's transform: true option.
 */
export class PaginationDto {
  /**
   * Page number for pagination (1-based).
   * Defaults to 1 if not provided.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  /**
   * Number of results per page.
   * Defaults to 20 if not provided. Maximum is 100.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

