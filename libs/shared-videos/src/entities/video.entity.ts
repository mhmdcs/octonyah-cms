import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum VideoType {
  VIDEO_PODCAST = 'video_podcast',
  DOCUMENTARY = 'documentary',
}

/**
 * Represents the source platform of a video.
 * NATIVE = uploaded directly to our platform
 * YOUTUBE = imported from YouTube
 * (more platforms can be added)
 */
export enum VideoPlatform {
  NATIVE = 'native',
  YOUTUBE = 'youtube',
}

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // TODO: maybe i should increase title length? 
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // "Technology", "Science", "History" etc
  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 50 })
  type: VideoType;

  // tags/keywords for search and filtering
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'integer' })
  duration: number; // in seconds

  @Column({ type: 'date' })
  publicationDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'varchar', length: 50, default: VideoPlatform.NATIVE })
  platform: VideoPlatform;

  @Column({ type: 'varchar', length: 100, nullable: true })
  platformVideoId?: string;

  /**
   * Embeddable URL for the video (e.g., YouTube embed URL)
   * Allows frontend to embed the video player
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  embedUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Soft delete timestamp - automatically set when soft deleted
  @DeleteDateColumn()
  deletedAt?: Date;
}
