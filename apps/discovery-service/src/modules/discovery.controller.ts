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
import { SearchProgramsDto } from './dto/search-programs.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { Program } from '@octonyah/shared-programs';
import { ProgramIndexQueueService } from '../jobs/program-index.queue.service';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly programIndexQueue: ProgramIndexQueueService,
  ) {}

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
  async search(
    @Query() searchDto: SearchProgramsDto,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.searchPrograms(searchDto);
  }

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
      if (error instanceof HttpException) {
        throw error; 
      }
      throw new HttpException('Program not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get('categories/:category')
  @ApiOperation({
    summary: 'Get programs by category',
    description: 'Retrieve all programs in a specific category with pagination',
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

  @Post('search/reindex')
  @ApiOperation({
    summary: 'Enqueue a full search index rebuild',
    description:
      'Triggers a BullMQ job that reads canonical data from Postgres and reindexes Elasticsearch.',
  })
  @ApiResponse({ status: 202, description: 'Reindex job enqueued' })
  async enqueueReindex() {
    await this.programIndexQueue.enqueueFullReindex();
    return { status: 'scheduled' };
  }
}
