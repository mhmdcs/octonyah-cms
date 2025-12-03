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

interface ThrottlePreset {
  ttl: number;
  limit: number;
}

/**
 * Creates a throttle decorator from a preset configuration.
 */
const createThrottleDecorator = (preset: ThrottlePreset) => () =>
  NestThrottle({ default: { ttl: preset.ttl, limit: preset.limit } });

/**
 * Apply custom throttle limits to an endpoint.
 * @param ttl Time-to-live in milliseconds
 * @param limit Maximum number of requests within TTL
 */
export const Throttle = (ttl: number, limit: number) =>
  NestThrottle({ default: { ttl, limit } });

/** Apply auth rate limits (5/min) - for login endpoints */
export const ThrottleAuth = createThrottleDecorator(THROTTLE_AUTH);

/** Apply heavy operation rate limits (2/min) - for reindex, bulk operations */
export const ThrottleHeavy = createThrottleDecorator(THROTTLE_HEAVY);

/** Apply CMS write rate limits (30/min) - for create/update operations */
export const ThrottleCmsWrite = createThrottleDecorator(THROTTLE_CMS_WRITE);

/** Apply CMS read rate limits (60/min) - for list/get operations */
export const ThrottleCmsRead = createThrottleDecorator(THROTTLE_CMS_READ);

/** Apply CMS delete rate limits (10/min) - for delete operations */
export const ThrottleCmsDelete = createThrottleDecorator(THROTTLE_CMS_DELETE);

/** Apply discovery search rate limits (100/min) - for search endpoints */
export const ThrottleDiscoverySearch = createThrottleDecorator(THROTTLE_DISCOVERY_SEARCH);

/** Apply discovery read rate limits (200/min) - for get endpoints */
export const ThrottleDiscoveryRead = createThrottleDecorator(THROTTLE_DISCOVERY_READ);

