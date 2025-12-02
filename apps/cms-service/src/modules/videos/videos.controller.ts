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
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ImportVideoDto } from './dto/import-video.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { StorageService } from '@octonyah/shared-storage';


@ApiTags('CMS Videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cms/videos')
export class VideosController {
  constructor(
    private readonly videosService: VideosService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @Roles('admin', 'editor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new video manually' })
  @ApiBody({ type: CreateVideoDto })
  @ApiResponse({ status: 201, description: 'Video successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createVideoDto: CreateVideoDto) {
    return this.videosService.create(createVideoDto);
  }

  @Post('import')
  @Roles('admin', 'editor')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Import a video from external platform',
    description:
      'Import a video from YouTube or other supported platforms. ' +
      'Automatically extracts metadata (title, description, duration, thumbnail) ' +
      'and downloads the thumbnail to our storage.',
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
  importVideo(@Body() importVideoDto: ImportVideoDto) {
    return this.videosService.importFromPlatform(importVideoDto);
  }

  @Get()
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Get all videos' })
  @ApiResponse({ status: 200, description: 'List of all videos' })
  findAll() {
    return this.videosService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Get a video by ID' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  @ApiResponse({ status: 200, description: 'Video found' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Update a video' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  @ApiBody({ type: UpdateVideoDto })
  @ApiResponse({ status: 200, description: 'Video successfully updated' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto) {
    return this.videosService.update(id, updateVideoDto);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a video' })
  @ApiParam({ name: 'id', description: 'Video UUID' })
  @ApiResponse({ status: 204, description: 'Video successfully deleted' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }

  @Post('upload/video')
  @Roles('admin', 'editor')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a video file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  async uploadVideo(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 500 * 1024 * 1024 }), // 500MB
          new FileTypeValidator({ fileType: /(video\/.*)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.storageService.uploadFile(file, 'videos');
    return { url };
  }

  @Post('upload/thumbnail')
  @Roles('admin', 'editor')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a thumbnail image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Thumbnail uploaded successfully' })
  async uploadThumbnail(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(image\/.*)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const url = await this.storageService.uploadFile(file, 'thumbnails');
    return { url };
  }
}

