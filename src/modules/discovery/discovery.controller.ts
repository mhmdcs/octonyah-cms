/**
 * Discovery Controller
 * 
 * This file defines the public-facing HTTP endpoints for the Discovery System.
 * These endpoints allow general users to search and explore programs stored in the CMS.
 * 
 * This controller provides public API endpoints:
 * - GET /discovery/search      - Search programs with filters and pagination
 * - GET /discovery/programs/:id - Get a specific program by ID
 * - GET /discovery/categories/:category - Get programs by category
 * - GET /discovery/types/:type - Get programs by type
 * 
 * All endpoints are public (no authentication required) and designed for
 * frontend integration. They include Swagger documentation for easy testing.
 */

import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DiscoveryService } from './discovery.service';
import { SearchProgramsDto } from './dto/search-programs.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { Program } from '../cms/programs/entities/program.entity';

/**
 * Controller class for discovery/public HTTP endpoints.
 * All routes are prefixed with 'discovery'.
 */
@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  /**
   * Constructor injects DiscoveryService to handle business logic.
   */
  constructor(private readonly discoveryService: DiscoveryService) {}

  /**
   * GET /discovery/search
   * 
   * Searches and filters programs based on query parameters.
   * Supports text search, filtering by category/type/language, and pagination.
   * 
   * @param searchDto - Search criteria and pagination parameters (from query string)
   * @returns Search results with programs and pagination metadata
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search programs',
    description:
      'Search and filter programs by text, category, type, language with pagination support',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results with programs and pagination metadata',
    type: SearchResponseDto,
  })
  async search(@Query() searchDto: SearchProgramsDto): Promise<SearchResponseDto> {
    return this.discoveryService.searchPrograms(searchDto);
  }

  /**
   * GET /discovery/programs/:id
   * 
   * Retrieves a specific program by its ID for public viewing.
   * 
   * @param id - UUID of the program to retrieve
   * @returns The program entity
   */
  @Get('programs/:id')
  @ApiOperation({
    summary: 'Get a program by ID',
    description: 'Retrieve a specific program by its UUID for public viewing',
  })
  @ApiParam({ name: 'id', description: 'Program UUID' })
  @ApiResponse({
    status: 200,
    description: 'Program found',
    type: Program,
  })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async getProgram(@Param('id') id: string): Promise<Program> {
    try {
      return await this.discoveryService.getProgram(id);
    } catch (error) {
      throw new HttpException(
        error.message || 'Program not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * GET /discovery/categories/:category
   * 
   * Gets all programs in a specific category.
   * Results are paginated and ordered by publication date (newest first).
   * 
   * @param category - Category name to filter by
   * @param page - Page number (default: 1)
   * @param limit - Results per page (default: 20)
   * @returns Search results with programs and pagination metadata
   */
  @Get('categories/:category')
  @ApiOperation({
    summary: 'Get programs by category',
    description: 'Retrieve all programs in a specific category with pagination',
  })
  @ApiParam({ name: 'category', description: 'Category name', example: 'Technology' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Programs in the specified category',
    type: SearchResponseDto,
  })
  async getByCategory(
    @Param('category') category: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getProgramsByCategory(category, page, limit);
  }

  /**
   * GET /discovery/types/:type
   * 
   * Gets all programs of a specific type (video_podcast or documentary).
   * Results are paginated and ordered by publication date (newest first).
   * 
   * @param type - Program type to filter by
   * @param page - Page number (default: 1)
   * @param limit - Results per page (default: 20)
   * @returns Search results with programs and pagination metadata
   */
  @Get('types/:type')
  @ApiOperation({
    summary: 'Get programs by type',
    description:
      'Retrieve all programs of a specific type (video_podcast or documentary) with pagination',
  })
  @ApiParam({
    name: 'type',
    description: 'Program type',
    enum: ['video_podcast', 'documentary'],
    example: 'video_podcast',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Programs of the specified type',
    type: SearchResponseDto,
  })
  async getByType(
    @Param('type') type: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getProgramsByType(type, page, limit);
  }
}

