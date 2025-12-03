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
import { SearchVideosDto } from './dto/search-videos.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { Video } from '@octonyah/shared-videos';
import {
  ThrottleDiscoverySearch,
  ThrottleDiscoveryRead,
} from '@octonyah/shared-throttler';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('search')
  @ThrottleDiscoverySearch() // 100 requests per minute - search is resource intensive
  @ApiOperation({
    summary: 'Search videos',
    description:
      'Search and filter videos by text, category, type with pagination support',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results with videos and pagination metadata',
    type: SearchResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit: 100/min',
  })
  async search(
    @Query() searchDto: SearchVideosDto,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.searchVideos(searchDto);
  }

  @Get('videos/:id')
  @ThrottleDiscoveryRead() // 200 requests per minute - simple lookups
  @ApiOperation({ summary: 'Get a video by ID', description: 'Retrieve a specific video by its UUID for public viewing' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  @ApiResponse({ status: 200, description: 'Video found', type: Video })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiResponse({ status: 429, description: 'Too many requests. Rate limit: 200/min' })
  async getVideo(@Param('id') id: string): Promise<Video> {
    try {
      return await this.discoveryService.getVideo(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get('categories/:category')
  @ThrottleDiscoverySearch() // 100 requests per minute - filtered queries
  @ApiOperation({
    summary: 'Get videos by category',
    description: 'Retrieve all videos in a specific category with pagination',
  })
  @ApiParam({
    name: 'category',
    description: 'Category name',
    example: 'Technology',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Videos in the specified category',
    type: SearchResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit: 100/min',
  })
  async getByCategory(
    @Param('category') category: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getVideosByCategory(category, page, limit);
  }

  @Get('types/:type')
  @ThrottleDiscoverySearch() // 100 requests per minute - filtered queries
  @ApiOperation({
    summary: 'Get videos by type',
    description:
      'Retrieve all videos of a specific type (video_podcast or documentary) with pagination',
  })
  @ApiParam({
    name: 'type',
    description: 'Video type',
    enum: ['video_podcast', 'documentary'],
    example: 'video_podcast',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Videos of the specified type',
    type: SearchResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit: 100/min',
  })
  async getByType(
    @Param('type') type: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getVideosByType(type, page, limit);
  }
}
