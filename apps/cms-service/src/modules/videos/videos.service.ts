import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Video, VideoLanguage } from '@octonyah/shared-videos';
import { CreateVideoDto } from './dto/create-video.dto';
import { UpdateVideoDto } from './dto/update-video.dto';
import { VideoEventsPublisher } from '@octonyah/shared-events';
import { StorageService } from '@octonyah/shared-storage';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

  constructor(
    @InjectRepository(Video)
    private readonly videoRepository: Repository<Video>,
    private readonly videoEventsPublisher: VideoEventsPublisher,
    private readonly storageService: StorageService,
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
    });
    const saved = await this.videoRepository.save(video);
    this.videoEventsPublisher.videoCreated(saved);
    return saved;
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

