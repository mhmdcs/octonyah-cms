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

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({
    type: 'enum',
    enum: ProgramType,
  })
  type: ProgramType;

  @Column({
    type: 'enum',
    enum: ProgramLanguage,
    default: ProgramLanguage.ARABIC,
  })
  language: ProgramLanguage;

  @Column({ type: 'integer' })
  duration: number; // in seconds

  @Column({ type: 'date' })
  publicationDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

