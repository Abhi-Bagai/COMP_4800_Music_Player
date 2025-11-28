/**
 * Client-side Spotify import service
 * 
 * This service handles importing Spotify playlists and tracks into your local SQLite database.
 * It's called after fetching playlist data from the backend API.
 */

import { and, eq } from 'drizzle-orm';
import { getDb } from '../db/client';
import { albums, artists, playlists, playlistTracks, tracks } from '../db/schema';

/**
 * Spotify track data from backend API
 */
export interface SpotifyTrackData {
  spotifyTrackId: string;
  name: string;
  artists: string[]; // Array of artist names
  albumName: string;
  albumImage: string | null;
  durationMs: number;
  spotifyUri: string;
  spotifyUrl: string;
  previewUrl: string | null;
  position: number;
}

/**
 * Generate track ID for Spotify tracks
 */
function generateTrackId(spotifyTrackId: string): string {
  return `spotify:${spotifyTrackId}`;
}

/**
 * Generate playlist ID for Spotify playlists
 */
function generatePlaylistId(spotifyPlaylistId: string): string {
  return `spotify:playlist:${spotifyPlaylistId}`;
}

/**
 * Find or create an artist by name
 */
async function findOrCreateArtist(artistName: string): Promise<string> {
  const db = await getDb();
  
  // Normalize name for lookup
  const normalizedName = artistName.trim().toLowerCase();
  const sortKey = artistName.trim();

  // Try to find existing artist
  const existing = await db
    .select()
    .from(artists)
    .where(eq(artists.sortKey, sortKey))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  // Create new artist
  const artistId = `artist:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(artists).values({
    id: artistId,
    name: artistName,
    sortKey: sortKey,
  });

  return artistId;
}

/**
 * Find or create an album by name and artist ID
 */
async function findOrCreateAlbum(
  albumName: string,
  artistId: string,
  artworkUri?: string | null
): Promise<string> {
  const db = await getDb();

  const sortKey = albumName.trim();

  // Try to find existing album
  const existing = await db
    .select()
    .from(albums)
    .where(
      and(eq(albums.artistId, artistId), eq(albums.sortKey, sortKey))
    )
    .limit(1);

  if (existing.length > 0) {
    // Update artwork if provided and different
    if (artworkUri && existing[0].artworkUri !== artworkUri) {
      await db
        .update(albums)
        .set({ artworkUri, updatedAt: new Date() })
        .where(eq(albums.id, existing[0].id));
    }
    return existing[0].id;
  }

  // Create new album
  const albumId = `album:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  await db.insert(albums).values({
    id: albumId,
    artistId,
    title: albumName,
    sortKey: sortKey,
    artworkUri: artworkUri || null,
  });

  return albumId;
}

/**
 * Find or create a track
 * 
 * Note: Your Track schema may need to be extended to support:
 * - source field ('local' | 'spotify')
 * - spotifyTrackId field
 * - spotifyUri field
 * - previewUrl field
 * 
 * For now, we'll use fileUri to store the previewUrl or spotifyUri
 */
async function findOrCreateTrack(
  trackData: SpotifyTrackData,
  artistId: string,
  albumId: string
): Promise<string> {
  const db = await getDb();
  const trackId = generateTrackId(trackData.spotifyTrackId);

  // Check if track exists
  const existing = await db
    .select()
    .from(tracks)
    .where(eq(tracks.id, trackId))
    .limit(1);

  if (existing.length > 0) {
    // Update if needed
    await db
      .update(tracks)
      .set({
        title: trackData.name,
        durationMs: trackData.durationMs,
        fileUri: trackData.previewUrl || trackData.spotifyUri,
        updatedAt: new Date(),
      })
      .where(eq(tracks.id, trackId));
    return trackId;
  }

  // Create new track
  // Use previewUrl if available, otherwise use spotifyUri
  // Your player will need to handle both cases
  await db.insert(tracks).values({
    id: trackId,
    albumId,
    artistId,
    title: trackData.name,
    durationMs: trackData.durationMs,
    fileUri: trackData.previewUrl || trackData.spotifyUri,
    // Note: Add spotifyTrackId, spotifyUri, previewUrl fields if you extend schema
  });

  return trackId;
}

/**
 * Import a Spotify playlist into local database
 * 
 * @param spotifyPlaylistId - Spotify playlist ID
 * @param playlistName - Name for the playlist
 * @param tracksData - Array of track data from backend API
 * @param coverImageUri - Optional cover image URI
 */
export async function importSpotifyPlaylist(
  spotifyPlaylistId: string,
  playlistName: string,
  tracksData: SpotifyTrackData[],
  coverImageUri?: string | null
): Promise<{
  playlistId: string;
  importedTracks: number;
  skippedTracks: number;
}> {
  const db = await getDb();
  const playlistId = generatePlaylistId(spotifyPlaylistId);

  // Create or update playlist
  const existingPlaylist = await db
    .select()
    .from(playlists)
    .where(eq(playlists.id, playlistId))
    .limit(1);

  if (existingPlaylist.length > 0) {
    // Update playlist
    await db
      .update(playlists)
      .set({
        name: playlistName,
        coverImageUri: coverImageUri || null,
        updatedAt: new Date(),
      })
      .where(eq(playlists.id, playlistId));

    // Clear existing tracks
    await db
      .delete(playlistTracks)
      .where(eq(playlistTracks.playlistId, playlistId));
  } else {
    // Create playlist
    await db.insert(playlists).values({
      id: playlistId,
      name: playlistName,
      coverImageUri: coverImageUri || null,
      isSystemPlaylist: false,
    });
  }

  // Import tracks
  let importedCount = 0;
  let skippedCount = 0;

  for (const trackData of tracksData) {
    try {
      // Handle multiple artists (use first artist for now, or create composite)
      // For simplicity, we'll use the first artist
      const primaryArtistName = trackData.artists[0] || 'Unknown Artist';
      const artistId = await findOrCreateArtist(primaryArtistName);

      // Create album
      const albumId = await findOrCreateAlbum(
        trackData.albumName,
        artistId,
        trackData.albumImage
      );

      // Create track
      const trackId = await findOrCreateTrack(trackData, artistId, albumId);

      // Add to playlist
      const playlistTrackId = `playlist_track:${playlistId}:${trackId}:${trackData.position}`;
      await db.insert(playlistTracks).values({
        id: playlistTrackId,
        playlistId,
        trackId,
        position: trackData.position,
      });

      importedCount++;
    } catch (error) {
      console.error(`Failed to import track ${trackData.spotifyTrackId}:`, error);
      skippedCount++;
    }
  }

  return {
    playlistId,
    importedTracks: importedCount,
    skippedTracks: skippedCount,
  };
}

