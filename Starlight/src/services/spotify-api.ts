/**
 * Frontend service for calling Spotify backend API
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  ownerName: string;
  trackCount: number;
  isPublic: boolean;
  isCollaborative: boolean;
}

interface SpotifyStatus {
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
 * Check if user has linked Spotify account
 */
export async function checkSpotifyStatus(): Promise<SpotifyStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/spotify/status`, {
      credentials: 'include', // Include cookies for session
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking Spotify status:', error);
    return { linked: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
 * Initiate Spotify OAuth login
 * Returns the auth URL to redirect to
 */
export function getSpotifyAuthUrl(): string {
  return `${API_BASE_URL}/auth/spotify/login`;
}

/**
 * Import selected Spotify playlists
 * This calls the backend which returns playlist data to import into local DB
 */
export async function importSpotifyPlaylist(
  playlistId: string,
  playlistName?: string
): Promise<{
  success: boolean;
  playlistId: string;
  playlistName: string;
  tracks: any[];
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

export type { SpotifyPlaylist, SpotifyStatus };
