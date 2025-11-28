/**
 * Server-side import service for Spotify tracks/playlists
 *
 * This service handles mapping Spotify API responses to your local database schema.
 *
 * IMPORTANT: This assumes you have a way to sync data between PostgreSQL (backend)
 * and SQLite (client). You have two options:
 *
 * Option 1: Store Spotify tracks in PostgreSQL, sync to client SQLite
 * Option 2: Return data from backend, client imports into local SQLite
 *
 * This implementation follows Option 2 (recommended for v1) - the backend returns
 * sanitized data, and the client handles local DB insertion.
 */

/**
 * Map Spotify track to local Track schema format
 *
 * Your local Track schema (from src/db/schema.ts):
 * - id: text (primary key)
 * - albumId: text (FK to albums)
 * - artistId: text (FK to artists)
 * - title: text
 * - durationMs: integer
 * - fileUri: text (for Spotify: use previewUrl or spotifyUri)
 * - source: 'local' | 'spotify' (you'll need to add this field)
 * - spotifyTrackId: text (you'll need to add this field)
 * - spotifyUri: text (you'll need to add this field)
 * - previewUrl: text (you'll need to add this field)
 */
export interface SpotifyTrackImport {
  spotifyTrackId: string;
  name: string;
  artists: string[]; // Array of artist names
  albumName: string;
  albumImage: string | null;
  durationMs: number;
  spotifyUri: string;
  spotifyUrl: string;
  previewUrl: string | null;
  position: number; // Position in playlist
}

/**
 * Generate a Starlight track ID from Spotify track ID
 */
export function generateTrackId(spotifyTrackId: string): string {
  return `spotify:${spotifyTrackId}`;
}

/**
 * Generate a Starlight playlist ID from Spotify playlist ID
 */
export function generatePlaylistId(spotifyPlaylistId: string): string {
  return `spotify:playlist:${spotifyPlaylistId}`;
}

/**
 * Prepare track data for local DB insertion
 *
 * Returns data ready to insert into your Track table
 * Note: You'll need to handle Artist and Album creation separately
 */
export function prepareTrackForImport(spotifyTrack: SpotifyTrackImport): {
  id: string;
  title: string;
  durationMs: number;
  // For Spotify tracks, fileUri can be previewUrl or spotifyUri
  // Your player will need to handle both cases
  fileUri: string; // Use previewUrl if available, otherwise spotifyUri
  spotifyTrackId: string;
  spotifyUri: string;
  previewUrl: string | null;
  // You'll need to resolve artistId and albumId from names
  // This is handled client-side in the import flow
} {
  return {
    id: generateTrackId(spotifyTrack.spotifyTrackId),
    title: spotifyTrack.name,
    durationMs: spotifyTrack.durationMs,
    fileUri: spotifyTrack.previewUrl || spotifyTrack.spotifyUri,
    spotifyTrackId: spotifyTrack.spotifyTrackId,
    spotifyUri: spotifyTrack.spotifyUri,
    previewUrl: spotifyTrack.previewUrl,
  };
}

/**
 * Client-side import instructions:
 *
 * When importing a Spotify playlist:
 *
 * 1. Call POST /api/spotify/playlists/:id/import
 * 2. For each track in the response:
 *    a. Find or create Artist(s) by name
 *    b. Find or create Album by name + artistId
 *    c. Find or create Track:
 *       - id: generateTrackId(spotifyTrackId)
 *       - Check if track exists by spotifyTrackId (if you add this field)
 *       - If exists, update; if not, create
 *       - Set source='spotify' (if you add this field)
 *       - Set fileUri to previewUrl or spotifyUri
 *    d. Create PlaylistTrack association with position
 *
 * 3. Create or update Playlist:
 *    - id: generatePlaylistId(spotifyPlaylistId)
 *    - name: playlistName from response
 *    - coverImageUri: from playlist metadata
 *
 * See client-side import example in: src/services/spotify-import-client.ts
 */
