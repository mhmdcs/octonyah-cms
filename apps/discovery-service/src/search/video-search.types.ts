import { VideoLanguage, VideoType } from '@octonyah/shared-videos';

export interface VideoSearchDocument {
  id: string;
  title: string;
  description?: string;
  category: string;
  type: VideoType;
  language: VideoLanguage;
  tags: string[];
  duration: number;
  popularityScore: number;
  publicationDate: string; // ISO string
  createdAt?: string;
  updatedAt?: string;
}

