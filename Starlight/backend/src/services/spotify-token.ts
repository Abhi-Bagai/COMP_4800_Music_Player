import { prisma } from '../db/client';
import { refreshAccessToken } from '../utils/spotify-api';

/**
 * Get a valid Spotify access token for a user
 * Automatically refreshes if expired
 */
export async function getValidSpotifyAccessToken(userId: string): Promise<string> {
  const account = await prisma.spotifyAccount.findUnique({
    where: { userId },
  });

  if (!account) {
    throw new Error('Spotify account not linked');
  }

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = new Date(account.expiresAt);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (now.getTime() >= expiresAt.getTime() - bufferMs) {
    // Token expired or about to expire, refresh it
    try {
      const tokenResponse = await refreshAccessToken(account.refreshToken);

      // Update stored token
      const newExpiresAt = new Date(now.getTime() + tokenResponse.expires_in * 1000);

      await prisma.spotifyAccount.update({
        where: { userId },
        data: {
          accessToken: tokenResponse.access_token,
          expiresAt: newExpiresAt,
          // Refresh token may or may not be returned
          refreshToken: tokenResponse.refresh_token || account.refreshToken,
          updatedAt: now,
        },
      });

      return tokenResponse.access_token;
    } catch (error) {
      // If refresh fails, the refresh token may be invalid
      // User needs to re-authenticate
      throw new Error(
        `Failed to refresh Spotify token: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  return account.accessToken;
}

/**
 * Check if user has linked Spotify account
 */
export async function hasSpotifyAccount(userId: string): Promise<boolean> {
  const account = await prisma.spotifyAccount.findUnique({
    where: { userId },
  });
  return !!account;
}
