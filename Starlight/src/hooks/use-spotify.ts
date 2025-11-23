/**
 * TanStack Query hooks for Spotify integration
 * 
 * These hooks provide reactive data fetching and mutations for Spotify features.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import {
    getSpotifyLoginUrl,
    getSpotifyPlaylists,
    getSpotifyPlaylistTracks,
    getSpotifyStatus,
    importSpotifyPlaylist,
    type SpotifyPlaylist,
    type SpotifyStatus,
    type SpotifyTrack,
} from '../services/spotify-api-client';
import { importSpotifyPlaylist as importToLocalDb } from '../services/spotify-import-client';

/**
 * Query key factories
 */
export const spotifyKeys = {
  all: ['spotify'] as const,
  status: () => [...spotifyKeys.all, 'status'] as const,
  playlists: () => [...spotifyKeys.all, 'playlists'] as const,
  playlistTracks: (playlistId: string) =>
    [...spotifyKeys.all, 'playlist', playlistId, 'tracks'] as const,
};

/**
 * Hook to check Spotify connection status
 */
export function useSpotifyStatus() {
  return useQuery<SpotifyStatus>({
    queryKey: spotifyKeys.status(),
    queryFn: getSpotifyStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch user's Spotify playlists
 */
export function useSpotifyPlaylists() {
  return useQuery<{ playlists: SpotifyPlaylist[]; total: number; hasMore: boolean }>({
    queryKey: spotifyKeys.playlists(),
    queryFn: getSpotifyPlaylists,
    enabled: false, // Only fetch when explicitly called (after connecting)
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch tracks for a Spotify playlist
 */
export function useSpotifyPlaylistTracks(playlistId: string | null) {
  return useQuery<{ tracks: SpotifyTrack[]; total: number; hasMore: boolean }>({
    queryKey: spotifyKeys.playlistTracks(playlistId || ''),
    queryFn: () => {
      if (!playlistId) throw new Error('Playlist ID required');
      return getSpotifyPlaylistTracks(playlistId);
    },
    enabled: !!playlistId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to initiate Spotify OAuth flow
 * Opens login URL in system browser
 */
export function useSpotifyLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const loginUrl = getSpotifyLoginUrl();
      
      // Open in system browser
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl,
        'starlight://auth/spotify/success'
      );

      if (result.type === 'success') {
        // Refetch status after successful login
        await queryClient.invalidateQueries({ queryKey: spotifyKeys.status() });
        await queryClient.invalidateQueries({ queryKey: spotifyKeys.playlists() });
        return { success: true };
      }

      throw new Error('Spotify login cancelled or failed');
    },
  });
}

/**
 * Hook to import a Spotify playlist into local database
 */
export function useImportSpotifyPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      playlistId,
      playlistName,
    }: {
      playlistId: string;
      playlistName?: string;
    }) => {
      // Fetch playlist data from backend
      const importData = await importSpotifyPlaylist(playlistId, playlistName);

      // Import into local SQLite database
      const result = await importToLocalDb(
        playlistId,
        importData.playlistName,
        importData.tracks,
        null // Cover image - you can fetch this from playlist metadata
      );

      return result;
    },
    onSuccess: () => {
      // Invalidate local library queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['library'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

/**
 * Hook to handle deep link callback from Spotify OAuth
 * Call this in your root component or deep link handler
 */
export function useSpotifyAuthCallback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (url: string) => {
      const parsed = Linking.parse(url);
      
      if (parsed.path === 'auth/spotify/success') {
        // Success - refetch status and playlists
        await queryClient.invalidateQueries({ queryKey: spotifyKeys.status() });
        await queryClient.invalidateQueries({ queryKey: spotifyKeys.playlists() });
        return { success: true };
      }

      if (parsed.queryParams?.error) {
        throw new Error(`Spotify auth error: ${parsed.queryParams.error}`);
      }

      return { success: false };
    },
  });
}

