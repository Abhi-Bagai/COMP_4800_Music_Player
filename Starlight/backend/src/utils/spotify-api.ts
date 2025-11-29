import { config } from '../config';

/**
 * Spotify API client utilities
 */

export interface SpotifyTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: Array<{ url: string }>;
  owner: {
    display_name: string;
  };
  tracks: {
    total: number;
  };
  public: boolean;
  collaborative: boolean;
}

export interface SpotifyPlaylistTrack {
  track: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
      name: string;
      images: Array<{ url: string }>;
    };
    duration_ms: number;
    preview_url: string | null;
    external_urls: {
      spotify: string;
    };
    uri: string;
  };
  added_at: string;
}

/**
 * Exchange authorization code for access token (OAuth callback)
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<SpotifyTokenResponse> {
  const response = await fetch(config.spotify.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${config.spotify.clientId}:${config.spotify.clientSecret}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<Omit<SpotifyTokenResponse, 'refresh_token'>> {
  const response = await fetch(config.spotify.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(
        `${config.spotify.clientId}:${config.spotify.clientSecret}`
      ).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  return response.json();
}

/**
 * Fetch Spotify user profile
 */
export async function fetchSpotifyUserProfile(accessToken: string): Promise<SpotifyUserProfile> {
  const response = await fetch(`${config.spotify.apiUrl}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user profile: ${error}`);
  }

  return response.json();
}

/**
 * Fetch user's playlists (with pagination support)
 */
export async function fetchUserPlaylists(
  accessToken: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ items: SpotifyPlaylist[]; total: number; next: string | null }> {
  const url = new URL(`${config.spotify.apiUrl}/me/playlists`);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch playlists: ${error}`);
  }

  return response.json();
}

/**
 * Fetch tracks for a specific playlist
 */
export async function fetchPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit: number = 100,
  offset: number = 0
): Promise<{
  items: SpotifyPlaylistTrack[];
  total: number;
  next: string | null;
}> {
  const url = new URL(`${config.spotify.apiUrl}/playlists/${playlistId}/tracks`);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());
  url.searchParams.set('market', 'US'); // Required for some tracks

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch playlist tracks: ${error}`);
  }

  return response.json();
}

/**
 * Fetch user's saved tracks (liked songs)
 */
export async function fetchSavedTracks(
  accessToken: string,
  limit: number = 50,
  offset: number = 0
): Promise<{
  items: Array<{
    track: {
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      album: {
        name: string;
        images: Array<{ url: string }>;
      };
      duration_ms: number;
      preview_url: string | null;
      external_urls: {
        spotify: string;
      };
      uri: string;
    };
    added_at: string;
  }>;
  total: number;
  next: string | null;
}> {
  const url = new URL(`${config.spotify.apiUrl}/me/tracks`);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());
  url.searchParams.set('market', 'US');

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch saved tracks: ${error}`);
  }

  return response.json();
}
