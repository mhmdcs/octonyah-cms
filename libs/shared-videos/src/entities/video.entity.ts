import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VideoType {
  VIDEO_PODCAST = 'video_podcast',
  DOCUMENTARY = 'documentary',
}

export enum VideoLanguage {
  ARABIC = 'ar',
  ENGLISH = 'en',
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

  // defaults to arabic? maybe rethink this later
  @Column({ type: 'varchar', length: 10, default: VideoLanguage.ARABIC })
  language: VideoLanguage;

  // tags/keywords for search and filtering
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  // Popularity score used for ranking (views, likes, etc)
  @Column({ type: 'integer', default: 0 })
  popularityScore: number;

  @Column({ type: 'integer' })
  duration: number; // in seconds

  @Column({ type: 'date' })
  publicationDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  videoUrl?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnailImageUrl?: string;

  /**
   * Source platform of the video (native, youtube, etc.)
   * Defaults to NATIVE for directly uploaded videos
   */
  @Column({ type: 'varchar', length: 50, default: VideoPlatform.NATIVE })
  platform: VideoPlatform;

  /**
   * Video ID on the external platform (e.g., YouTube video ID)
   * Null for native uploads
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  platformVideoId?: string;

  /**
   * Embeddable URL for the video (e.g., YouTube embed URL)
   * Allows frontend to embed the video player
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  embedUrl?: string;

  /**
   * Original thumbnail URL from the source platform
   * Stored for reference; actual thumbnail served from our storage
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  originalThumbnailUrl?: string;

  // Auto set timestamp thru TypeORM
  @CreateDateColumn()
  createdAt: Date;

  // Auto update timestamp thru TypeORM
  @UpdateDateColumn()
  updatedAt: Date;
}
