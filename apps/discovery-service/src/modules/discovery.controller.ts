import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
  HttpException,
  Post,
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
import { VideoIndexQueueService } from '../jobs/video-index.queue.service';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly videoIndexQueue: VideoIndexQueueService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search videos',
    description:
      'Search and filter videos by text, category, type, language with pagination support',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results with videos and pagination metadata',
    type: SearchResponseDto,
  })
  async search(
    @Query() searchDto: SearchVideosDto,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.searchVideos(searchDto);
  }

  @Get('videos/:id')
  @ApiOperation({
    summary: 'Get a video by ID',
    description: 'Retrieve a specific video by its UUID for public viewing',
  })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  @ApiResponse({
    status: 200,
    description: 'Video found',
    type: Video,
  })
  @ApiResponse({ status: 404, description: 'Video not found' })
  async getVideo(@Param('id') id: string): Promise<Video> {
    try {
      return await this.discoveryService.getVideo(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error; 
      }
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get('categories/:category')
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
  async getByCategory(
    @Param('category') category: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getVideosByCategory(category, page, limit);
  }

  @Get('types/:type')
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
  async getByType(
    @Param('type') type: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getVideosByType(type, page, limit);
  }

  @Post('search/reindex')
  @ApiOperation({
    summary: 'Enqueue a full search index rebuild',
    description:
      'Triggers a BullMQ job that reads canonical data from Postgres and reindexes Elasticsearch.',
  })
  @ApiResponse({ status: 202, description: 'Reindex job enqueued' })
  async enqueueReindex() {
    await this.videoIndexQueue.enqueueFullReindex();
    return { status: 'scheduled' };
  }
}
