import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ImportVideoDto } from './dto/import-video.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import {
  ThrottleCmsWrite,
  ThrottleCmsRead,
  ThrottleCmsDelete,
  ThrottleHeavy,
} from '@octonyah/shared-throttler';

@ApiTags('CMS Videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cms/videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post('import')
  @Roles('admin', 'editor')
  @ThrottleCmsWrite() // 30 requests per minute
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Import a video from external platform',
    description:
      'Import a video from YouTube or other supported platforms. ' +
      'Automatically extracts metadata (title, description, duration, thumbnail).',
  })
  @ApiBody({ type: ImportVideoDto })
  @ApiResponse({
    status: 201,
    description: 'Video successfully imported',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid URL or unsupported platform',
  })
  @ApiResponse({
    status: 409,
    description: 'Video already imported',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests. Rate limit: 30/min',
  })
  importVideo(@Body() importVideoDto: ImportVideoDto) {
    return this.videosService.importFromPlatform(importVideoDto);
  }

  @Get()
  @Roles('admin', 'editor')
  @ThrottleCmsRead() // 60 requests per minute
  @ApiOperation({ summary: 'Get all videos' })
  @ApiResponse({ status: 200, description: 'List of all videos' })
  @ApiResponse({ status: 429, description: 'Too many requests. Rate limit: 60/min' })
  findAll() {
    return this.videosService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'editor')
  @ThrottleCmsRead() // 60 requests per minute
  @ApiOperation({ summary: 'Get a video by ID' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  @ApiResponse({ status: 200, description: 'Video found' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiResponse({ status: 429, description: 'Too many requests. Rate limit: 60/min' })
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ThrottleCmsWrite() // 30 requests per minute
  @ApiOperation({ summary: 'Update a video' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  @ApiBody({ type: UpdateVideoDto })
  @ApiResponse({ status: 200, description: 'Video successfully updated' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 429, description: 'Too many requests. Rate limit: 30/min' })
  update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto) {
    return this.videosService.update(id, updateVideoDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ThrottleCmsDelete() // 10 requests per minute
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a video' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  @ApiResponse({ status: 204, description: 'Video successfully deleted' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiResponse({ status: 429, description: 'Too many requests. Rate limit: 10/min' })
  remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }

  @Post('reindex')
  @Roles('admin')
  @ThrottleHeavy() // 2 requests per minute - expensive operation
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Trigger full search index rebuild',
    description:
      'Enqueues a job that reads canonical data from Postgres and reindexes Elasticsearch. Admin only.',
  })
  @ApiResponse({ status: 202, description: 'Reindex job enqueued' })
  @ApiResponse({ status: 429, description: 'Too many requests. Rate limit: 2/min' })
  triggerReindex() {
    this.videosService.triggerReindex();
    return { status: 'scheduled' };
  }
}
