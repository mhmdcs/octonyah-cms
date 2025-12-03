import { Controller, Get, Query, Param } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';
import { SearchVideosDto } from './dto/search-videos.dto';
import { SearchResponseDto } from './dto/search-response.dto';
import { Video } from '@octonyah/shared-videos';
import { ThrottleDiscoverySearch, ThrottleDiscoveryRead } from '@octonyah/shared-throttler';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('search')
  @ThrottleDiscoverySearch()
  search(@Query() searchDto: SearchVideosDto): Promise<SearchResponseDto> {
    return this.discoveryService.searchVideos(searchDto);
  }

  @Get('videos/:id')
  @ThrottleDiscoveryRead()
  getVideo(@Param('id') id: string): Promise<Video> {
    return this.discoveryService.getVideo(id);
  }

  @Get('categories/:category')
  @ThrottleDiscoverySearch()
  getByCategory(
    @Param('category') category: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getVideosByCategory(category, page, limit);
  }

  @Get('types/:type')
  @ThrottleDiscoverySearch()
  getByType(
    @Param('type') type: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<SearchResponseDto> {
    return this.discoveryService.getVideosByType(type, page, limit);
  }
}
