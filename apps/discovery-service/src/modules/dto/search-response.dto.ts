/**
 * Search Response DTO
 * 
 * This file defines the response structure for search results.
 * It includes the programs array, pagination metadata, and total count
 * to help frontend applications implement pagination controls.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Program } from '@octonyah/shared-programs';

/**
 * Response DTO for search results.
 * Includes the programs array and pagination metadata.
 */
export class SearchResponseDto {
  /**
   * Array of programs matching the search criteria.
   */
  @ApiProperty({
    description: 'Array of programs matching the search criteria',
    type: [Program],
  })
  data: Program[];

  /**
   * Total number of programs matching the search criteria (across all pages).
   */
  @ApiProperty({
    description: 'Total number of programs matching the search criteria',
    example: 150,
  })
  total: number;

  /**
   * Current page number (1-based).
   */
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  /**
   * Number of results per page.
   */
  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
  })
  limit: number;

  /**
   * Total number of pages available.
   */
  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  /**
   * Whether there is a next page.
   */
  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  /**
   * Whether there is a previous page.
   */
  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrev: boolean;
}

