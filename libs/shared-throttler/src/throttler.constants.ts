/**
 * Rate limit presets for different endpoint types.
 * These are designed to balance security and usability.
 * 
 * TTL is in milliseconds.
 */

/** Auth endpoints - strict limits to prevent brute force attacks */
export const THROTTLE_AUTH = {
  name: 'auth',
  ttl: 60000, // 1 minute
  limit: 5,   // 5 requests per minute
};

/** Heavy/expensive operations (reindex, bulk imports) */
export const THROTTLE_HEAVY = {
  name: 'heavy',
  ttl: 60000, // 1 minute
  limit: 2,   // 2 requests per minute
};

/** Write operations (create, update, delete) for CMS */
export const THROTTLE_CMS_WRITE = {
  name: 'cms-write',
  ttl: 60000, // 1 minute
  limit: 30,  // 30 requests per minute
};

/** Read operations for CMS (admin dashboard) */
export const THROTTLE_CMS_READ = {
  name: 'cms-read',
  ttl: 60000, // 1 minute
  limit: 60,  // 60 requests per minute
};

/** Delete operations - more restrictive */
export const THROTTLE_CMS_DELETE = {
  name: 'cms-delete',
  ttl: 60000, // 1 minute
  limit: 10,  // 10 requests per minute
};

/** Public search endpoints - higher limits for consumer traffic */
export const THROTTLE_DISCOVERY_SEARCH = {
  name: 'discovery-search',
  ttl: 60000, // 1 minute
  limit: 100, // 100 requests per minute
};

/** Public read endpoints - highest limits */
export const THROTTLE_DISCOVERY_READ = {
  name: 'discovery-read',
  ttl: 60000, // 1 minute
  limit: 200, // 200 requests per minute
};

/** Default limits per service type */
export const CMS_DEFAULT_THROTTLE = {
  ttl: 60000,
  limit: 60,
};

export const DISCOVERY_DEFAULT_THROTTLE = {
  ttl: 60000,
  limit: 120,
};

