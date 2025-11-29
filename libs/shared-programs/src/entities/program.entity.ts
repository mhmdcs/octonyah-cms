import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProgramType {
  VIDEO_PODCAST = 'video_podcast',
  DOCUMENTARY = 'documentary',
}

export enum ProgramLanguage {
  ARABIC = 'ar',
  ENGLISH = 'en',
}

@Entity('programs')
export class Program {
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
  type: ProgramType;

  // defaults to arabic? maybe rethink this later
  @Column({ type: 'varchar', length: 10, default: ProgramLanguage.ARABIC })
  language: ProgramLanguage;

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

  // Auto set timestamp thru TypeORM
  @CreateDateColumn()
  createdAt: Date;

  // Auto update timestamp thru TypeORM
  @UpdateDateColumn()
  updatedAt: Date;
}
