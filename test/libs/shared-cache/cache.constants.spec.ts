import {
  VIDEO_CACHE_PREFIX,
  SEARCH_CACHE_PREFIX,
  buildVideoCacheKey,
} from '@octonyah/shared-cache/cache.constants';

describe('Cache Constants', () => {
  describe('VIDEO_CACHE_PREFIX', () => {
    it('should be defined', () => {
      expect(VIDEO_CACHE_PREFIX).toBe('discovery:video');
    });
  });

  describe('SEARCH_CACHE_PREFIX', () => {
    it('should be defined', () => {
      expect(SEARCH_CACHE_PREFIX).toBe('discovery:search');
    });
  });

  describe('buildVideoCacheKey', () => {
    it('should build correct cache key for video', () => {
      const key = buildVideoCacheKey('test-uuid-123');

      expect(key).toBe('discovery:video:test-uuid-123');
    });

    it('should handle empty video ID', () => {
      const key = buildVideoCacheKey('');

      expect(key).toBe('discovery:video:');
    });

    it('should handle special characters in video ID', () => {
      const key = buildVideoCacheKey('video-with-dashes-123');

      expect(key).toBe('discovery:video:video-with-dashes-123');
    });
  });
});

