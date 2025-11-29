/**
 * Client-side Spotify API service
 *
 * This service provides functions to interact with the Starlight backend
 * Spotify endpoints. All Spotify API calls go through the backend.
 */

// Support both environment variable names for compatibility
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8081';

/**
 * Spotify connection status
 */
export interface SpotifyStatus {
  linked: boolean;
  profile?: {
    id: string;
    displayName: string;
    email: string;
    image: string | null;
  };
  error?: string;
}

/**
 * Spotify playlist (sanitized from backend)
 */
export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  ownerName: string;
  trackCount: number;
  isPublic: boolean;
  isCollaborative: boolean;
}

/**
 * Spotify track (sanitized from backend)
 */
export interface SpotifyTrack {
  spotifyTrackId: string;
  name: string;
  artists: string[];
  albumName: string;
  albumImage: string | null;
  durationMs: number;
  spotifyUri: string;
  spotifyUrl: string;
  previewUrl: string | null;
  addedAt: string;
}

/**
 * Check Spotify connection status
 */
export async function getSpotifyStatus(): Promise<SpotifyStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/spotify/status`, {
      credentials: 'include', // Include session cookies
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking Spotify status:', error);
    return {
      linked: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's Spotify playlists
 */
export async function getSpotifyPlaylists(): Promise<{
  playlists: SpotifyPlaylist[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/spotify/playlists`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not authenticated. Please connect your Spotify account.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Spotify playlists:', error);
    throw error;
  }
}

/**
 * Get tracks for a Spotify playlist
 */
export async function getSpotifyPlaylistTracks(playlistId: string): Promise<{
  tracks: SpotifyTrack[];
  total: number;
  hasMore: boolean;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/spotify/playlists/${playlistId}/tracks`, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not authenticated. Please connect your Spotify account.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching playlist tracks:', error);
    throw error;
  }
}

/**
 * Import a Spotify playlist
 * Returns data ready for local DB import
 */
export async function importSpotifyPlaylist(
  playlistId: string,
  playlistName?: string
): Promise<{
  success: boolean;
  playlistId: string;
  playlistName: string;
  tracks: Array<{
    spotifyTrackId: string;
    name: string;
    artists: string[];
    albumName: string;
    albumImage: string | null;
    durationMs: number;
    spotifyUri: string;
    spotifyUrl: string;
    previewUrl: string | null;
    position: number;
  }>;
  importedCount: number;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/spotify/playlists/${playlistId}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ playlistName }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Not authenticated. Please connect your Spotify account.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error importing Spotify playlist:', error);
    throw error;
  }
}

/**
 * Get Spotify OAuth login URL
 * Opens in system browser
 */
export function getSpotifyLoginUrl(): string {
  return `${API_BASE_URL}/auth/spotify/login`;
}

/**
 * Alias for backward compatibility
 * @deprecated Use getSpotifyStatus instead
 */
export const checkSpotifyStatus = getSpotifyStatus;

/**
 * Alias for backward compatibility
 * @deprecated Use getSpotifyLoginUrl instead
 */
export const getSpotifyAuthUrl = getSpotifyLoginUrl;
