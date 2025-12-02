export const VIDEO_CACHE_PREFIX = 'discovery:video';
export const SEARCH_CACHE_PREFIX = 'discovery:search';

export const buildVideoCacheKey = (videoId: string) =>
  `${VIDEO_CACHE_PREFIX}:${videoId}`;

