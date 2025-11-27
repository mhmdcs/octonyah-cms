export const PROGRAM_CACHE_PREFIX = 'discovery:program';
export const SEARCH_CACHE_PREFIX = 'discovery:search';

export const buildProgramCacheKey = (programId: string) =>
  `${PROGRAM_CACHE_PREFIX}:${programId}`;

