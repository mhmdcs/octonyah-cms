/**
 * Program Entity
 * 
 * This file defines the database entity for programs (video podcasts and documentaries).
 * It uses TypeORM decorators to map the class to a database table called 'programs'.
 * 
 * The entity represents a visual program with metadata including:
 * - Basic information (title, description, category)
 * - Type classification (video podcast or documentary)
 * - Language support (Arabic or English)
 * - Duration and publication date
 * - Automatic timestamps for creation and updates
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Enum defining the types of programs supported in the system.
 * Used to categorize content as either video podcasts or documentaries.
 */
export enum ProgramType {
  VIDEO_PODCAST = 'video_podcast',
  DOCUMENTARY = 'documentary',
}

/**
 * Enum defining supported languages for programs.
 * Used to specify the language of the content.
 */
export enum ProgramLanguage {
  ARABIC = 'ar',
  ENGLISH = 'en',
}

/**
 * Program Entity Class
 * 
 * Maps to the 'programs' table in the database.
 * Each instance represents a single program with all its metadata.
 */
@Entity('programs')
export class Program {
  /**
   * Unique identifier for the program.
   * Automatically generated as a UUID when a new program is created.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Title of the program.
   * Required field with maximum length of 255 characters.
   */
  @Column({ type: 'varchar', length: 255 })
  title: string;

  /**
   * Detailed description of the program.
   * Optional field that can store longer text content.
   */
  @Column({ type: 'text', nullable: true })
  description: string;

  /**
   * Category classification for the program (e.g., "Technology", "Science", "History").
   * Required field with maximum length of 100 characters.
   */
  @Column({ type: 'varchar', length: 100 })
  category: string;

  /**
   * Type of program: either a video podcast or a documentary.
   * Uses the ProgramType enum to ensure valid values.
   */
  @Column({ type: 'varchar', length: 50 })
  type: ProgramType;

  /**
   * Language of the program content.
   * Defaults to Arabic if not specified.
   * Uses the ProgramLanguage enum to ensure valid values.
   */
  @Column({ type: 'varchar', length: 10, default: ProgramLanguage.ARABIC })
  language: ProgramLanguage;

  /**
   * Duration of the program in seconds.
   * Required integer field representing the total length of the content.
   */
  @Column({ type: 'integer' })
  duration: number; // in seconds

  /**
   * Date when the program was published or made available.
   * Required date field.
   */
  @Column({ type: 'date' })
  publicationDate: Date;

  /**
   * Timestamp automatically set when the program record is first created.
   * Managed by TypeORM - no manual setting required.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Timestamp automatically updated whenever the program record is modified.
   * Managed by TypeORM - no manual setting required.
   */
  @UpdateDateColumn()
  updatedAt: Date;
}

