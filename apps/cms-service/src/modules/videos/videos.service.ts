import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoPlatform } from '@octonyah/shared-videos';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ImportVideoDto } from './dto/import-video.dto';
import { VideoEventsPublisher } from '@octonyah/shared-events';
import { VideoPlatformsService, VideoMetadata } from '@octonyah/shared-video-platforms';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly videoEventsPublisher: VideoEventsPublisher,
    private readonly videoPlatformsService: VideoPlatformsService,
  ) {}

  async importFromPlatform(dto: ImportVideoDto): Promise<Video> {
    this.logger.log(`Importing video from URL: ${dto.url}`);
    const metadata = await this.videoPlatformsService.fetchMetadataFromUrl(dto.url);
    await this.ensureNotDuplicate(metadata.platform, metadata.platformVideoId);

    const video = this.videoRepository.create(this.buildImportedVideo(dto, metadata));
    const saved = await this.videoRepository.save(video);
    this.logger.log(`Successfully imported video: ${saved.id} from ${metadata.platform}`);
    this.videoEventsPublisher.videoCreated(saved);
    return saved;
  }

  private async ensureNotDuplicate(platform: VideoPlatform, platformVideoId: string): Promise<void> {
    const existing = await this.videoRepository.findOne({ where: { platform, platformVideoId } });
    if (existing) throw new ConflictException(`Video already imported: ${existing.id} (${platform}:${platformVideoId})`);
  }

  private buildImportedVideo(dto: ImportVideoDto, metadata: VideoMetadata) {
    return {
      title: dto.title || metadata.title,
      description: dto.description || metadata.description,
      category: dto.category,
      type: dto.type,
      duration: metadata.durationSeconds,
      tags: this.mergeTags(metadata.tags, dto.tags),
      publicationDate: metadata.publishedAt,
      videoUrl: metadata.originalUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      platform: metadata.platform,
      platformVideoId: metadata.platformVideoId,
      embedUrl: metadata.embedUrl,
    };
  }

  /** Merge tags from platform and user input, removing duplicates (case-insensitive) */
  private mergeTags(platformTags?: string[], userTags?: string[]): string[] {
    const all = [...this.normalizeTags(userTags), ...this.normalizeTags(platformTags)];
    const seen = new Set<string>();
    return all.filter((tag) => !seen.has(tag.toLowerCase()) && seen.add(tag.toLowerCase()));
  }

  async findAll(): Promise<Video[]> {
    return this.videoRepository.find({ order: { publicationDate: 'DESC' } });
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) throw new NotFoundException(`Video with ID ${id} not found`);
    return video;
  }

  async update(id: string, dto: UpdateVideoDto): Promise<Video> {
    const video = await this.findOne(id);
    
    const { tags, publicationDate, ...rest } = dto;
    Object.assign(video, rest);
    if (tags !== undefined) video.tags = this.normalizeTags(tags);
    if (publicationDate !== undefined) video.publicationDate = new Date(publicationDate);

    const updated = await this.videoRepository.save(video);
    this.videoEventsPublisher.videoUpdated(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const video = await this.findOne(id);
    await this.videoRepository.softRemove(video);
    this.videoEventsPublisher.videoDeleted({ id });
  }

  triggerReindex(): void {
    this.logger.log('Triggering full search index rebuild');
    this.videoEventsPublisher.reindexRequested();
  }

  private normalizeTags(tags?: string[]): string[] {
    return tags?.map((t) => t.trim()).filter(Boolean) ?? [];
  }
}
