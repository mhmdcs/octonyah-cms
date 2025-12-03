import {
  Controller,
  Get,
  Query,
  Param,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { SearchVideosDto } from './dto/search-videos.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { Video } from '@octonyah/shared-videos';
import {
  ThrottleDiscoverySearch,
  ThrottleDiscoveryRead,
} from '@octonyah/shared-throttler';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('search')
  @ThrottleDiscoverySearch()
  async search(
    @Query() searchDto: SearchVideosDto,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.searchVideos(searchDto);
  }

  @Get('videos/:id')
  @ThrottleDiscoveryRead()
  async getVideo(@Param('id') id: string): Promise<Video> {
    try {
      return await this.discoveryService.getVideo(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
    }
  }

  @Get('categories/:category')
  @ThrottleDiscoverySearch()
  async getByCategory(
    @Param('category') category: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getVideosByCategory(category, page, limit);
  }

  @Get('types/:type')
  @ThrottleDiscoverySearch()
  async getByType(
    @Param('type') type: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getVideosByType(type, page, limit);
  }
}
