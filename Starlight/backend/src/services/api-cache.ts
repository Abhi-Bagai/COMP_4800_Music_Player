import { config } from '../config';
import { prisma } from '../db/client';

/**
 * Get cached API response if still valid
 */
export async function getCachedResponse<T>(key: string): Promise<T | null> {
  const cached = await prisma.apiCache.findUnique({
    where: { key },
  });

  if (!cached) {
    return null;
  }

  // Check if expired
  if (new Date() >= cached.expiresAt) {
    // Delete expired cache
    await prisma.apiCache.delete({
      where: { key },
    });
    return null;
  }

  return JSON.parse(cached.payload) as T;
}

/**
 * Store API response in cache
 */
export async function setCachedResponse<T>(
  key: string,
  payload: T,
  userId: string,
  ttlSeconds: number = config.cache.ttl
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await prisma.apiCache.upsert({
    where: { key },
    create: {
      key,
      payload: JSON.stringify(payload),
      expiresAt,
      userId,
    },
    update: {
      payload: JSON.stringify(payload),
      expiresAt,
      updatedAt: new Date(),
    },
  });
}

/**
 * Generate cache key for Spotify resource
 */
export function generateCacheKey(userId: string, resource: string, resourceId?: string): string {
  if (resourceId) {
    return `spotify:${userId}:${resource}:${resourceId}`;
  }
  return `spotify:${userId}:${resource}`;
}

/**
 * Invalidate cache for a user (e.g., after importing playlists)
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await prisma.apiCache.deleteMany({
    where: {
      userId,
      key: {
        startsWith: `spotify:${userId}:`,
      },
    },
  });
}

/**
 * Cleanup expired cache entries (run periodically)
 */
export async function cleanupExpiredCache(): Promise<number> {
  const result = await prisma.apiCache.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
