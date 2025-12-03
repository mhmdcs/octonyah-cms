import { SkipThrottle as NestSkipThrottle } from '@nestjs/throttler';

/**
 * Decorator to skip throttling for specific endpoints.
 * Useful for health checks and internal endpoints.
 */
export const SkipThrottle = NestSkipThrottle;

