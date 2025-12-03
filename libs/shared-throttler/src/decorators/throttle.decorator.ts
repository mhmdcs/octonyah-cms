import { Throttle as NestThrottle } from '@nestjs/throttler';
import {
  THROTTLE_AUTH,
  THROTTLE_HEAVY,
  THROTTLE_CMS_WRITE,
  THROTTLE_CMS_READ,
  THROTTLE_CMS_DELETE,
  THROTTLE_DISCOVERY_SEARCH,
  THROTTLE_DISCOVERY_READ,
} from '../throttler.constants';

/**
 * Apply custom throttle limits to an endpoint.
 * @param ttl Time-to-live in milliseconds
 * @param limit Maximum number of requests within TTL
 */
export const Throttle = (ttl: number, limit: number) =>
  NestThrottle({ default: { ttl, limit } });

/** Apply auth rate limits (5/min) - for login endpoints */
export const ThrottleAuth = () =>
  NestThrottle({ default: { ttl: THROTTLE_AUTH.ttl, limit: THROTTLE_AUTH.limit } });

/** Apply heavy operation rate limits (2/min) - for reindex, bulk operations */
export const ThrottleHeavy = () =>
  NestThrottle({ default: { ttl: THROTTLE_HEAVY.ttl, limit: THROTTLE_HEAVY.limit } });

/** Apply CMS write rate limits (30/min) - for create/update operations */
export const ThrottleCmsWrite = () =>
  NestThrottle({ default: { ttl: THROTTLE_CMS_WRITE.ttl, limit: THROTTLE_CMS_WRITE.limit } });

/** Apply CMS read rate limits (60/min) - for list/get operations */
export const ThrottleCmsRead = () =>
  NestThrottle({ default: { ttl: THROTTLE_CMS_READ.ttl, limit: THROTTLE_CMS_READ.limit } });

/** Apply CMS delete rate limits (10/min) - for delete operations */
export const ThrottleCmsDelete = () =>
  NestThrottle({ default: { ttl: THROTTLE_CMS_DELETE.ttl, limit: THROTTLE_CMS_DELETE.limit } });

/** Apply discovery search rate limits (100/min) - for search endpoints */
export const ThrottleDiscoverySearch = () =>
  NestThrottle({ default: { ttl: THROTTLE_DISCOVERY_SEARCH.ttl, limit: THROTTLE_DISCOVERY_SEARCH.limit } });

/** Apply discovery read rate limits (200/min) - for get endpoints */
export const ThrottleDiscoveryRead = () =>
  NestThrottle({ default: { ttl: THROTTLE_DISCOVERY_READ.ttl, limit: THROTTLE_DISCOVERY_READ.limit } });

