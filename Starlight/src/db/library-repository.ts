import { and, eq, inArray } from 'drizzle-orm';
import { Platform } from 'react-native';

import { getDb, schema } from './client';
import {
  idbSaveArtists,
  idbSaveAlbums,
  idbSaveTracks,
  idbMarkTracksAsDeleted,
  idbDeleteTrack,
  idbClearLibrary,
  idbFetchLibrarySnapshot,
  idbFindTrackByFile,
  idbCheckTrackExists,
  idbUpdateTrackDuration,
} from './indexeddb';

export interface ArtistUpsert {
  id: string;
  name: string;
  sortKey: string;
}

export interface AlbumUpsert {
  id: string;
  artistId: string;
  title: string;
  sortKey: string;
  year?: number | null;
  artworkUri?: string | null;
  primaryColor?: string | null;
}

export interface TrackUpsert {
  id: string;
  albumId: string;
  artistId: string;
  title: string;
  durationMs?: number | null;
  discNumber?: number | null;
  trackNumber?: number | null;
  bitrate?: number | null;
  sampleRate?: number | null;
  fileUri: string;
  fileMtime?: number | null;
  fileSize?: number | null;
  hash?: string | null;
}

export interface LibraryBatchUpsert {
  artists: ArtistUpsert[];
  albums: AlbumUpsert[];
  tracks: TrackUpsert[];
}

async function upsertLibraryBatchWeb({ artists, albums, tracks }: LibraryBatchUpsert) {
  await idbSaveArtists(
    artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
      sortKey: artist.sortKey,
    }))
  );

  await idbSaveAlbums(
    albums.map((album) => ({
      id: album.id,
      artistId: album.artistId,
      title: album.title,
      sortKey: album.sortKey,
      year: album.year ?? null,
      artworkUri: album.artworkUri ?? null,
      primaryColor: album.primaryColor ?? null,
    }))
  );

  await idbSaveTracks(
    tracks.map((track) => ({
      id: track.id,
      albumId: track.albumId,
      artistId: track.artistId,
      title: track.title,
      durationMs: track.durationMs ?? null,
      discNumber: track.discNumber ?? null,
      trackNumber: track.trackNumber ?? null,
      bitrate: track.bitrate ?? null,
      sampleRate: track.sampleRate ?? null,
      fileUri: track.fileUri,
      fileMtime: track.fileMtime ?? null,
      fileSize: track.fileSize ?? null,
      hash: track.hash ?? null,
    }))
  );
}

export async function upsertLibraryBatch({ artists, albums, tracks }: LibraryBatchUpsert) {
  // Use platform-specific approach to avoid sync timeouts on web
  if (Platform.OS === 'web') {
    return await upsertLibraryBatchWeb({ artists, albums, tracks });
  }

  // For mobile platforms, use Drizzle ORM with smaller batches
  const db = await getDb();
  const BATCH_SIZE = 10;

  // Process artists in batches
  for (let i = 0; i < artists.length; i += BATCH_SIZE) {
    const batch = artists.slice(i, i + BATCH_SIZE);
    await db.transaction(async (tx) => {
      for (const artist of batch) {
        const artistData = { ...artist };
        console.log('DB: Inserting artist:', artistData);
        await tx
          .insert(schema.artists)
          .values(artistData)
          .onConflictDoNothing();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Process albums in batches
  for (let i = 0; i < albums.length; i += BATCH_SIZE) {
    const batch = albums.slice(i, i + BATCH_SIZE);
    await db.transaction(async (tx) => {
      for (const album of batch) {
        const albumData = { ...album };
        console.log('DB: Inserting album:', albumData);
        await tx
          .insert(schema.albums)
          .values(albumData)
          .onConflictDoNothing();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // Process tracks in batches
  for (let i = 0; i < tracks.length; i += BATCH_SIZE) {
    const batch = tracks.slice(i, i + BATCH_SIZE);
    await db.transaction(async (tx) => {
      for (const track of batch) {
        const trackData = {
          ...track,
          discNumber: track.discNumber ?? null,
          trackNumber: track.trackNumber ?? null,
          durationMs: track.durationMs ?? null,
          bitrate: track.bitrate ?? null,
          sampleRate: track.sampleRate ?? null,
          fileMtime: track.fileMtime ?? null,
          fileSize: track.fileSize ?? null,
          hash: track.hash ?? null,
          isDeleted: false,
        };
        console.log('DB: Inserting track:', trackData);
        await tx
          .insert(schema.tracks)
          .values(trackData)
          .onConflictDoNothing();
      }
    });
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

export async function markTracksAsDeleted(trackIds: string[]) {
  if (!trackIds.length) return;
  if (Platform.OS === 'web') {
    await idbMarkTracksAsDeleted(trackIds);
    return;
  }

  const db = await getDb();
  await db
    .update(schema.tracks)
    .set({ isDeleted: true })
    .where(inArray(schema.tracks.id, trackIds));
}

export async function deleteTrackPermanently(trackId: string) {
  if (Platform.OS === 'web') {
    await idbDeleteTrack(trackId);
    return;
  }
  const db = await getDb();
  await db.delete(schema.tracks).where(eq(schema.tracks.id, trackId));
}

export async function clearAllTracks() {
  if (Platform.OS === 'web') {
    await idbClearLibrary();
    return;
  }
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(schema.tracks);
    await tx.delete(schema.albums);
    await tx.delete(schema.artists);
  });
}

export async function fetchLibrarySnapshot() {
  if (Platform.OS === 'web') {
    return await idbFetchLibrarySnapshot();
  }

  const db = await getDb();
  const allTracks = await db.query.tracks.findMany({
    where: eq(schema.tracks.isDeleted, false),
    with: {
      album: true,
      artist: true,
    },
  });
  return allTracks;
}

export async function findTrackByFile(uri: string, mtime?: number | null) {
  if (Platform.OS === 'web') {
    const record = await idbFindTrackByFile(uri, mtime);
    return record ?? null;
  }
  const db = await getDb();
  let condition: any = eq(schema.tracks.fileUri, uri);
  if (typeof mtime === 'number') {
    condition = and(condition, eq(schema.tracks.fileMtime, mtime));
  }
  const [track] = await db.select().from(schema.tracks).where(condition);
  return track ?? null;
}

export async function checkTrackExists(title: string, artistName: string, fileSize: number): Promise<boolean> {
  // Check if a track with the same title and artist already exists
  if (Platform.OS === 'web') {
    return await idbCheckTrackExists(title, artistName);
  }
  const db = await getDb();
  const result = await db
    .select({ count: schema.tracks.id })
    .from(schema.tracks)
    .innerJoin(schema.artists, eq(schema.tracks.artistId, schema.artists.id))
    .where(
      and(
        eq(schema.tracks.title, title),
        eq(schema.artists.name, artistName),
        eq(schema.tracks.isDeleted, false)
      )
    );
  return result.length > 0;
}

export async function updateTrackDuration(trackId: string, durationMs: number) {
  if (Platform.OS === 'web') {
    await idbUpdateTrackDuration(trackId, durationMs);
    return;
  }

  const db = await getDb();
  await db
    .update(schema.tracks)
    .set({ durationMs })
    .where(eq(schema.tracks.id, trackId));
}

export type LibraryTrack = Awaited<ReturnType<typeof fetchLibrarySnapshot>> extends (infer Item)[]
  ? Item
  : never;
