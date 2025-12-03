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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cms/videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  @Roles('admin', 'editor')
  @ThrottleCmsWrite()
  @HttpCode(HttpStatus.CREATED)
  importVideo(@Body() importVideoDto: ImportVideoDto) {
    return this.videosService.importFromPlatform(importVideoDto);
  }

  @Get()
  @Roles('admin', 'editor')
  @ThrottleCmsRead()
  findAll() {
    return this.videosService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'editor')
  @ThrottleCmsRead()
  findOne(@Param('id') id: string) {
    return this.videosService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'editor')
  @ThrottleCmsWrite()
  update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto) {
    return this.videosService.update(id, updateVideoDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ThrottleCmsDelete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }

  @Post('reindex')
  @Roles('admin')
  @ThrottleHeavy()
  @HttpCode(HttpStatus.ACCEPTED)
  triggerReindex() {
    this.videosService.triggerReindex();
    return { status: 'scheduled' };
  }
}
