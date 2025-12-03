import { Video } from '@octonyah/shared-videos';

/**
 * Response DTO for search results.
 * Includes the videos array, pagination metadata, and total count
 * to help frontends implement pagination.
 */
export class SearchResponseDto {
  /**
   * Array of videos matching the search criteria.
   */
  data: Video[];

  /**
   * Total number of videos matching the search criteria (across all pages).
   */
  total: number;

  /**
   * Current page number (1-based).
   */
  page: number;

  /**
   * Number of results per page.
   */
  limit: number;

  /**
   * Total number of pages available.
   */
  totalPages: number;

  /**
   * Whether there is a next page.
   */
  hasNext: boolean;

  /**
   * Whether there is a previous page.
   */
  hasPrev: boolean;
}
