import { ProgramLanguage, ProgramType } from '@octonyah/shared-programs';

export interface ProgramSearchDocument {
  id: string;
  title: string;
  description?: string;
  category: string;
  type: ProgramType;
  language: ProgramLanguage;
  tags: string[];
  duration: number;
  popularityScore: number;
  publicationDate: string; // ISO string
  createdAt?: string;
  updatedAt?: string;
}

