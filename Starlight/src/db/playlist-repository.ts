import { and, asc, eq } from 'drizzle-orm';

import { Platform } from 'react-native';

import { getDb, schema } from './client';
import {
  idbCreatePlaylist,
  idbGetAllPlaylists,
  idbGetPlaylistWithTracks,
  idbNextPlaylistPosition,
  idbAddTrackToPlaylist,
  idbRemoveTrackFromPlaylist,
  idbDeletePlaylist,
  idbUpdatePlaylist,
  idbClearPlaylists,
} from './indexeddb';

export interface CreatePlaylistData {
  name: string;
  description?: string;
  coverImageUri?: string;
}

export interface PlaylistWithTracks {
  id: string;
  name: string;
  description: string | null;
  coverImageUri: string | null;
  isSystemPlaylist: boolean;
  createdAt: Date;
  updatedAt: Date;
  tracks: Array<{
    id: string;
    position: number;
    addedAt: Date;
    track: {
      id: string;
      title: string;
      artist: { name: string } | null;
      album: { title: string } | null;
      durationMs: number | null;
      fileUri: string;
    };
  }>;
}

// Generate a simple ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export async function createPlaylist(data: CreatePlaylistData): Promise<string> {
  const playlistId = generateId();

  if (Platform.OS === 'web') {
    await idbCreatePlaylist({
      id: playlistId,
      name: data.name,
      description: data.description ?? null,
      coverImageUri: data.coverImageUri ?? null,
    });
    return playlistId;
  }

  // Use shared database instance for all platforms to prevent access handle conflicts
  const db = await getDb();
  await db.insert(schema.playlists).values({
    id: playlistId,
    name: data.name,
    description: data.description || null,
    coverImageUri: data.coverImageUri || null,
  });

  return playlistId;
}

export async function getAllPlaylists() {
  if (Platform.OS === 'web') {
    const rows = await idbGetAllPlaylists();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      cover_image_uri: row.cover_image_uri,
      is_system_playlist: row.is_system_playlist,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  const db = await getDb();
  return await db.query.playlists.findMany({
    orderBy: [asc(schema.playlists.createdAt)],
    with: {
      playlistTracks: true,
    },
  });
}

export async function getPlaylistWithTracks(playlistId: string): Promise<PlaylistWithTracks | null> {
  if (Platform.OS === 'web') {
    const result = await idbGetPlaylistWithTracks(playlistId);
    if (!result) return null;

    const { playlist, entries, tracks } = result;
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      coverImageUri: playlist.cover_image_uri,
      isSystemPlaylist: !!playlist.is_system_playlist,
      createdAt: new Date(playlist.created_at),
      updatedAt: new Date(playlist.updated_at),
      tracks: entries
        .filter((entry) => !!tracks.get(entry.track_id))
        .map((entry, index) => {
          const track = tracks.get(entry.track_id);
          return {
            id: entry.id,
            position: entry.position ?? index + 1,
            addedAt: new Date(entry.added_at ?? Date.now()),
            track: {
              id: track.id,
              title: track.title,
              artist: null,
              album: null,
              durationMs: track.duration_ms ?? null,
              fileUri: track.file_uri ?? '',
            },
          };
        }),
    } as PlaylistWithTracks;
  }

  const db = await getDb();
  const result = await db.query.playlists.findFirst({
    where: eq(schema.playlists.id, playlistId),
    with: {
      playlistTracks: {
        orderBy: [asc(schema.playlistTracks.position)],
        with: {
          track: {
            with: {
              artist: true,
              album: true,
            },
          },
        },
      },
    },
  });

  if (!result) return null;

  return {
    ...result,
    tracks: result.playlistTracks.map(pt => ({
      id: pt.id,
      position: pt.position,
      addedAt: pt.addedAt,
      track: {
        id: pt.track.id,
        title: pt.track.title,
        artist: pt.track.artist,
        album: pt.track.album,
        durationMs: pt.track.durationMs,
        fileUri: pt.track.fileUri,
      }
    }))
  } as PlaylistWithTracks;
}

export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  if (Platform.OS === 'web') {
    const position = await idbNextPlaylistPosition(playlistId);
    await idbAddTrackToPlaylist({
      id: generateId(),
      playlist_id: playlistId,
      track_id: trackId,
      position,
      added_at: Date.now(),
    });
    return;
  }

  const db = await getDb();
  const result = await db
    .select({ maxPos: schema.playlistTracks.position })
    .from(schema.playlistTracks)
    .where(eq(schema.playlistTracks.playlistId, playlistId))
    .orderBy(asc(schema.playlistTracks.position))
    .limit(1);

  const nextPosition = (result[0]?.maxPos || 0) + 1;

  await db.insert(schema.playlistTracks).values({
    id: generateId(),
    playlistId,
    trackId,
    position: nextPosition,
  });
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  if (Platform.OS === 'web') {
    await idbRemoveTrackFromPlaylist(playlistId, trackId);
    return;
  }
  const db = await getDb();
  await db
    .delete(schema.playlistTracks)
    .where(
      and(
        eq(schema.playlistTracks.playlistId, playlistId),
        eq(schema.playlistTracks.trackId, trackId)
      )
    );
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  if (Platform.OS === 'web') {
    await idbDeletePlaylist(playlistId);
    return;
  }
  const db = await getDb();
  await db.delete(schema.playlists).where(eq(schema.playlists.id, playlistId));
}

export async function updatePlaylist(playlistId: string, data: Partial<CreatePlaylistData>): Promise<void> {
  if (Platform.OS === 'web') {
    await idbUpdatePlaylist(playlistId, {
      name: data.name,
      description: data.description,
      coverImageUri: data.coverImageUri,
    });
    return;
  }
  const db = await getDb();
  await db
    .update(schema.playlists)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(schema.playlists.id, playlistId));
}

export async function clearAllPlaylists(): Promise<void> {
  if (Platform.OS === 'web') {
    await idbClearPlaylists();
    return;
  }
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(schema.playlistTracks);
    await tx.delete(schema.playlists);
  });
}
