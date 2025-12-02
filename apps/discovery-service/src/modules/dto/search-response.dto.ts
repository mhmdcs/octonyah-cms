import { ApiProperty } from '@nestjs/swagger';
import { Video } from '@octonyah/shared-videos';

// includes the videos array, pagination metadata, total count
// to help frontends implement pagination
export class SearchResponseDto {
  @ApiProperty({
    description: 'Array of videos matching the search criteria',
    type: [Video],
  })
  data: Video[];

  // all pages of videos
  @ApiProperty({
    description: 'Total number of videos matching the search criteria',
    example: 150,
  })
  total: number;

  // Current page number (1-based)
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  // Number of results per page
  @ApiProperty({
    description: 'Number of results per page',
    example: 20,
  })
  limit: number;

  // Total number of pages available
  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  totalPages: number;

  // Whether there is a next page
  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  // Whether there is a previous page
  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrev: boolean;
}

