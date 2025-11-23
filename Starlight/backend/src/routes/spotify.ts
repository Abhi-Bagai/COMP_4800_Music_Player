import { Context } from 'koa';
import Router from 'koa-router';
import { getCurrentUserId, requireAuth } from '../middleware/auth';
import { invalidateUserCache } from '../services/api-cache';
import { fetchWithSpotifyCache } from '../services/spotify-cache-wrapper';
import { getValidSpotifyAccessToken, hasSpotifyAccount } from '../services/spotify-token';
import type {
    SpotifyPlaylist,
    SpotifyPlaylistTrack,
} from '../utils/spotify-api';
import {
    fetchPlaylistTracks,
    fetchSpotifyUserProfile,
    fetchUserPlaylists,
} from '../utils/spotify-api';

const router = new Router({ prefix: '/api/spotify' });

/**
 * GET /api/spotify/status
 * Returns whether the current user has linked Spotify
 */
router.get('/status', requireAuth, async (ctx: Context) => {
  const userId = getCurrentUserId(ctx);
  const linked = await hasSpotifyAccount(userId);

  if (!linked) {
    ctx.body = { linked: false };
    return;
  }

  // Optionally include profile info
  try {
    const accessToken = await getValidSpotifyAccessToken(userId);
    const profile = await fetchSpotifyUserProfile(accessToken);

    ctx.body = {
      linked: true,
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        email: profile.email,
        image: profile.images[0]?.url || null,
      },
    };
  } catch (error) {
    // If token refresh fails, account may need re-linking
    ctx.body = {
      linked: false,
      error: 'Token refresh failed, please reconnect',
    };
  }
});

/**
 * GET /api/spotify/playlists
 * Returns user's Spotify playlists
 */
router.get('/playlists', requireAuth, async (ctx: Context) => {
  const userId = getCurrentUserId(ctx);

  try {
    const result = await fetchWithSpotifyCache<{
      items: SpotifyPlaylist[];
      total: number;
      next: string | null;
    }>(
      userId,
      'playlists',
      async (accessToken) => {
        // Fetch first page (50 playlists)
        // For v1, we'll just return the first page
        // Client can request more if needed
        return fetchUserPlaylists(accessToken, 50, 0);
      }
    );

    // Sanitize response for frontend
    const playlists = result.items.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      image: playlist.images[0]?.url || null,
      ownerName: playlist.owner.display_name,
      trackCount: playlist.tracks.total,
      isPublic: playlist.public,
      isCollaborative: playlist.collaborative,
    }));

    ctx.body = {
      playlists,
      total: result.total,
      hasMore: !!result.next,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: 'Failed to fetch playlists',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

/**
 * GET /api/spotify/playlists/:id/tracks
 * Returns tracks for a specific playlist
 */
router.get('/playlists/:id/tracks', requireAuth, async (ctx: Context) => {
  const userId = getCurrentUserId(ctx);
  const playlistId = ctx.params.id;

  if (!playlistId) {
    ctx.status = 400;
    ctx.body = { error: 'Playlist ID required' };
    return;
  }

  try {
    const result = await fetchWithSpotifyCache<{
      items: SpotifyPlaylistTrack[];
      total: number;
      next: string | null;
    }>(
      userId,
      'playlist-tracks',
      async (accessToken) => {
        // Fetch first 100 tracks (Spotify limit per request)
        return fetchPlaylistTracks(accessToken, playlistId, 100, 0);
      },
      playlistId
    );

    // Sanitize tracks for frontend
    const tracks = result.items
      .filter((item) => item.track !== null) // Some tracks may be null
      .map((item) => ({
        spotifyTrackId: item.track.id,
        name: item.track.name,
        artists: item.track.artists.map((a) => a.name),
        albumName: item.track.album.name,
        albumImage: item.track.album.images[0]?.url || null,
        durationMs: item.track.duration_ms,
        spotifyUri: item.track.uri,
        spotifyUrl: item.track.external_urls.spotify,
        previewUrl: item.track.preview_url,
        addedAt: item.added_at,
      }));

    ctx.body = {
      tracks,
      total: result.total,
      hasMore: !!result.next,
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: 'Failed to fetch playlist tracks',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

/**
 * POST /api/spotify/playlists/:id/import
 * Imports a Spotify playlist into the local Starlight database
 * 
 * Returns data ready for client-side import into local SQLite DB
 */
router.post('/playlists/:id/import', requireAuth, async (ctx: Context) => {
  const userId = getCurrentUserId(ctx);
  const playlistId = ctx.params.id;
  const { playlistName } = ctx.request.body as { playlistName?: string };

  if (!playlistId) {
    ctx.status = 400;
    ctx.body = { error: 'Playlist ID required' };
    return;
  }

  try {
    // Fetch playlist tracks (bypass cache for import to get fresh data)
    const accessToken = await getValidSpotifyAccessToken(userId);

    // Fetch all tracks (handle pagination)
    const tracks: SpotifyPlaylistTrack[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore && tracks.length < 1000) {
      // Limit to 1000 tracks for v1
      const response = await fetchPlaylistTracks(
        accessToken,
        playlistId,
        100,
        offset
      );
      tracks.push(...response.items.filter((item) => item.track !== null));
      hasMore = !!response.next;
      offset += 100;
    }

    // Transform tracks for import (match client-side expected format)
    const tracksToImport = tracks.map((item, index) => {
      const track = item.track;
      return {
        spotifyTrackId: track.id,
        name: track.name,
        artists: track.artists.map((a) => a.name), // Array format for client
        albumName: track.album.name,
        albumImage: track.album.images[0]?.url || null,
        durationMs: track.duration_ms,
        spotifyUri: track.uri,
        spotifyUrl: track.external_urls.spotify,
        previewUrl: track.preview_url,
        position: index, // Preserve playlist order
      };
    });

    // Return data for client to import into local DB
    ctx.body = {
      success: true,
      playlistId,
      playlistName: playlistName || `Spotify Playlist ${playlistId}`,
      tracks: tracksToImport,
      importedCount: tracksToImport.length,
    };

    // Invalidate cache after import
    await invalidateUserCache(userId);
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      error: 'Failed to import playlist',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

export default router;

