import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoLanguage, VideoPlatform } from '@octonyah/shared-videos';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { ImportVideoDto } from './dto/import-video.dto';
import { VideoEventsPublisher } from '@octonyah/shared-events';
import { StorageService } from '@octonyah/shared-storage';
import { VideoPlatformsService } from '@octonyah/shared-video-platforms';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly videoEventsPublisher: VideoEventsPublisher,
    private readonly storageService: StorageService,
    private readonly videoPlatformsService: VideoPlatformsService,
  ) {}

  async create(createVideoDto: CreateVideoDto): Promise<Video> {
    const video = this.videoRepository.create({
      title: createVideoDto.title,
      description: createVideoDto.description,
      category: createVideoDto.category,
      type: createVideoDto.type,
      language: createVideoDto.language || VideoLanguage.ARABIC,
      duration: createVideoDto.duration,
      tags: this.normalizeTags(createVideoDto.tags),
      popularityScore: createVideoDto.popularityScore ?? 0,
      // Convert date string to Date object
      publicationDate: new Date(createVideoDto.publicationDate),
      videoUrl: createVideoDto.videoUrl,
      thumbnailImageUrl: createVideoDto.thumbnailImageUrl,
      // Platform-related fields
      platform: createVideoDto.platform || VideoPlatform.NATIVE,
      platformVideoId: createVideoDto.platformVideoId,
      embedUrl: createVideoDto.embedUrl,
      originalThumbnailUrl: createVideoDto.originalThumbnailUrl,
    });
    const saved = await this.videoRepository.save(video);
    this.videoEventsPublisher.videoCreated(saved);
    return saved;
  }

  /**
   * Import a video from an external platform (e.g., YouTube).
   * Automatically extracts metadata, downloads thumbnail to our storage,
   * and creates the video record.
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

    // Download thumbnail from platform and upload to our storage
    let thumbnailImageUrl: string | undefined;
    try {
      thumbnailImageUrl = await this.storageService.downloadAndUpload(
        metadata.thumbnailUrl,
        'thumbnails',
      );
      this.logger.log(`Uploaded thumbnail to: ${thumbnailImageUrl}`);
    } catch (error) {
      this.logger.warn(
        `Failed to download thumbnail, using original URL: ${error}`,
      );
      // Fall back to original thumbnail URL if download fails
      thumbnailImageUrl = metadata.thumbnailUrl;
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
      // Thumbnail is stored in our storage
      thumbnailImageUrl,
      // Platform-specific fields
      platform: metadata.platform,
      platformVideoId: metadata.platformVideoId,
      embedUrl: metadata.embedUrl,
      originalThumbnailUrl: metadata.thumbnailUrl,
    });

    const saved = await this.videoRepository.save(video);
    this.logger.log(
      `Successfully imported video: ${saved.id} from ${metadata.platform}`,
    );

    // Publish event for discovery service to index
    this.videoEventsPublisher.videoCreated(saved);

    return saved;
  }

  /**
   * Merge tags from platform and user input, removing duplicates
   */
  private mergeTags(
    platformTags?: string[],
    userTags?: string[],
  ): string[] {
    const normalizedPlatformTags = this.normalizeTags(platformTags);
    const normalizedUserTags = this.normalizeTags(userTags);

    // Combine and deduplicate (case-insensitive)
    const tagSet = new Set<string>();
    const result: string[] = [];

    for (const tag of [...normalizedUserTags, ...normalizedPlatformTags]) {
      const lowerTag = tag.toLowerCase();
      if (!tagSet.has(lowerTag)) {
        tagSet.add(lowerTag);
        result.push(tag);
      }
    }

    return result;
  }

  // Returns videos ordered by publication date (newest first)
  // Array of all videos  ordered by publication date descending
  async findAll(): Promise<Video[]> {
    return await this.videoRepository.find({
      order: { publicationDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Video> {
    const video = await this.videoRepository.findOne({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }
    return video;
  }

  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {
    const video = await this.findOne(id);
    
    // Delete old video file if it's being replaced
    if (updateVideoDto.videoUrl !== undefined && video.videoUrl && video.videoUrl !== updateVideoDto.videoUrl) {
      try {
        await this.storageService.deleteFile(video.videoUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete old video file: ${video.videoUrl}`, error);
      }
    }
    
    // Delete old thumbnail file if it's being replaced
    if (updateVideoDto.thumbnailImageUrl !== undefined && video.thumbnailImageUrl && video.thumbnailImageUrl !== updateVideoDto.thumbnailImageUrl) {
      try {
        await this.storageService.deleteFile(video.thumbnailImageUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete old thumbnail file: ${video.thumbnailImageUrl}`, error);
      }
    }
    
    const updateData: Partial<Video> = {};
    if (updateVideoDto.title !== undefined) updateData.title = updateVideoDto.title;
    if (updateVideoDto.description !== undefined) updateData.description = updateVideoDto.description;
    if (updateVideoDto.category !== undefined) updateData.category = updateVideoDto.category;
    if (updateVideoDto.type !== undefined) updateData.type = updateVideoDto.type;
    if (updateVideoDto.language !== undefined) updateData.language = updateVideoDto.language;
    if (updateVideoDto.duration !== undefined) updateData.duration = updateVideoDto.duration;
    if (updateVideoDto.tags !== undefined) updateData.tags = this.normalizeTags(updateVideoDto.tags);
    if (updateVideoDto.popularityScore !== undefined) updateData.popularityScore = updateVideoDto.popularityScore;
    if (updateVideoDto.publicationDate !== undefined) updateData.publicationDate = new Date(updateVideoDto.publicationDate);
    if (updateVideoDto.videoUrl !== undefined) updateData.videoUrl = updateVideoDto.videoUrl;
    if (updateVideoDto.thumbnailImageUrl !== undefined) updateData.thumbnailImageUrl = updateVideoDto.thumbnailImageUrl;

    Object.assign(video, updateData);
    const updated = await this.videoRepository.save(video);
    this.videoEventsPublisher.videoUpdated(updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const video = await this.findOne(id);
    await this.deleteVideoMediaFiles(video);
    await this.videoRepository.remove(video);
    this.videoEventsPublisher.videoDeleted({ id });
  }

  private async deleteVideoMediaFiles(video: Video): Promise<void> {
    if (video.videoUrl) {
      try {
        await this.storageService.deleteFile(video.videoUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete video file: ${video.videoUrl}`, error);
      }
    }

    if (video.thumbnailImageUrl) {
      try {
        await this.storageService.deleteFile(video.thumbnailImageUrl);
      } catch (error) {
        this.logger.warn(`Failed to delete thumbnail file: ${video.thumbnailImageUrl}`, error);
      }
    }
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!tags) {
      return [];
    }
    return tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
}

