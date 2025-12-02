import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoLanguage, VideoPlatform } from '@octonyah/shared-videos';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ImportVideoDto } from './dto/import-video.dto';
import { VideoEventsPublisher } from '@octonyah/shared-events';
import { VideoPlatformsService } from '@octonyah/shared-video-platforms';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly videoEventsPublisher: VideoEventsPublisher,
    private readonly videoPlatformsService: VideoPlatformsService,
  ) {}

  async create(dto: CreateVideoDto): Promise<Video> {
    const video = this.videoRepository.create({
      ...dto,
      language: dto.language || VideoLanguage.ARABIC,
      tags: this.normalizeTags(dto.tags),
      popularityScore: dto.popularityScore ?? 0,
      publicationDate: new Date(dto.publicationDate),
      platform: dto.platform || VideoPlatform.NATIVE,
    });
    const saved = await this.videoRepository.save(video);
    this.videoEventsPublisher.videoCreated(saved);
    return saved;
  }

  /**
   * Import a video from an external platform (e.g., YouTube).
   * Automatically extracts metadata and creates the video record.
   *
   * @param importVideoDto - Import parameters with URL and optional overrides
   * @returns Created video record
   */
  async importFromPlatform(importVideoDto: ImportVideoDto): Promise<Video> {
    this.logger.log(`Importing video from URL: ${importVideoDto.url}`);

    // Detect platform and extract metadata from platform API
    const metadata = await this.videoPlatformsService.fetchMetadataFromUrl(
      importVideoDto.url,
    );

    // Check if video already exists (avoid duplicates)
    const existingVideo = await this.videoRepository.findOne({
      where: {
        platform: metadata.platform,
        platformVideoId: metadata.platformVideoId,
      },
    });

    if (existingVideo) {
      throw new ConflictException(
        `Video already imported: ${existingVideo.id} (${metadata.platform}:${metadata.platformVideoId})`,
      );
    }

    // Merge platform metadata with user overrides
    // User-provided values take precedence
    const mergedTags = this.mergeTags(metadata.tags, importVideoDto.tags);

    const video = this.videoRepository.create({
      // Use user override if provided, otherwise use platform metadata
      title: importVideoDto.title || metadata.title,
      description: importVideoDto.description || metadata.description,
      category: importVideoDto.category,
      type: importVideoDto.type,
      language: importVideoDto.language || VideoLanguage.ARABIC,
      duration: metadata.durationSeconds,
      tags: mergedTags,
      popularityScore: importVideoDto.popularityScore ?? 0,
      publicationDate: metadata.publishedAt,
      // For external videos, videoUrl is the original platform URL
      videoUrl: metadata.originalUrl,
      thumbnailUrl: metadata.thumbnailUrl,
      // Platform-specific fields
      platform: metadata.platform,
      platformVideoId: metadata.platformVideoId,
      embedUrl: metadata.embedUrl,
    });

    const saved = await this.videoRepository.save(video);
    this.logger.log(
      `Successfully imported video: ${saved.id} from ${metadata.platform}`,
    );

    // Publish event for discovery service to index
    this.videoEventsPublisher.videoCreated(saved);

    return saved;
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

  private normalizeTags(tags?: string[]): string[] {
    return tags?.map((t) => t.trim()).filter(Boolean) ?? [];
  }
}

