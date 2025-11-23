import { generateCacheKey, getCachedResponse, setCachedResponse } from './api-cache';
import { getValidSpotifyAccessToken } from './spotify-token';

/**
 * Wrapper function to fetch from Spotify API with caching
 *
 * @param userId - Current user ID
 * @param resource - Resource type (e.g., 'playlists', 'playlist-tracks')
 * @param resourceId - Optional resource ID (e.g., playlist ID)
 * @param fetchFn - Function that fetches from Spotify API
 * @param ttlSeconds - Cache TTL in seconds (defaults to config value)
 */
export async function fetchWithSpotifyCache<T>(
  userId: string,
  resource: string,
  fetchFn: (accessToken: string) => Promise<T>,
  resourceId?: string,
  ttlSeconds?: number
): Promise<T> {
  const cacheKey = generateCacheKey(userId, resource, resourceId);

  // Try cache first
  const cached = await getCachedResponse<T>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch from Spotify
  const accessToken = await getValidSpotifyAccessToken(userId);
  const data = await fetchFn(accessToken);

  // Store in cache
  await setCachedResponse(cacheKey, data, userId, ttlSeconds);

  return data;
}
