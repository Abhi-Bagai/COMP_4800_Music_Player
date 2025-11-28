/*
 * Web persistence utilities backed by IndexedDB.
 *
 * This module provides a lightweight abstraction that mirrors the subset of
 * database operations we perform through SQLite on native platforms. The goal
 * is to keep the repository layer mostly unchanged while swapping the storage
 * backend for web builds.
 */

import { Platform } from 'react-native';

export interface ArtistRecord {
  id: string;
  name: string;
  sortKey: string;
}

export interface AlbumRecord {
  id: string;
  artistId: string;
  title: string;
  sortKey: string;
  year?: number | null;
  artworkUri?: string | null;
  primaryColor?: string | null;
}

export interface TrackRecord {
  id: string;
  albumId: string;
  artistId: string;
  title: string;
  durationMs?: number | null;
  discNumber?: number | null;
  trackNumber?: number | null;
  bitrate?: number | null;
  sampleRate?: number | null;
  genre?: string | null;
  fileUri: string;
  fileMtime?: number | null;
  fileSize?: number | null;
  hash?: string | null;
}

export interface PlaybackStateRecord {
  activeTrackId?: string | null;
  positionMs: number;
  volume: number;
  isMuted: boolean;
}

export interface CreatePlaylistRecord {
  id: string;
  name: string;
  description?: string | null;
  coverImageUri?: string | null;
}

const DB_NAME = 'starlight-indexeddb';
const DB_VERSION = 1;

type StoreName =
  | 'artists'
  | 'albums'
  | 'tracks'
  | 'playlists'
  | 'playlist_tracks'
  | 'playback_state';

type StoreMap = {
  artists: IDBObjectStore;
  albums: IDBObjectStore;
  tracks: IDBObjectStore;
  playlists: IDBObjectStore;
  playlist_tracks: IDBObjectStore;
  playback_state: IDBObjectStore;
};

let dbPromise: Promise<IDBDatabase> | null = null;

function ensureBrowserSupport() {
  if (Platform.OS !== 'web') {
    throw new Error('IndexedDB storage is only meant to be used on web.');
  }
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not available in this environment.');
  }
}

function openDatabase(): Promise<IDBDatabase> {
  ensureBrowserSupport();

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains('artists')) {
        const store = db.createObjectStore('artists', { keyPath: 'id' });
        store.createIndex('name_lower', 'name_lower', { unique: false });
      }

      if (!db.objectStoreNames.contains('albums')) {
        const store = db.createObjectStore('albums', { keyPath: 'id' });
        store.createIndex('artist_id', 'artist_id', { unique: false });
      }

      if (!db.objectStoreNames.contains('tracks')) {
        const store = db.createObjectStore('tracks', { keyPath: 'id' });
        store.createIndex('artist_id', 'artist_id', { unique: false });
        store.createIndex('album_id', 'album_id', { unique: false });
        store.createIndex('file_uri', 'file_uri', { unique: false });
        store.createIndex('title_artist_key', 'title_artist_key', {
          unique: false,
        });
      }

      if (!db.objectStoreNames.contains('playlists')) {
        const store = db.createObjectStore('playlists', { keyPath: 'id' });
        store.createIndex('created_at', 'created_at', { unique: false });
      }

      if (!db.objectStoreNames.contains('playlist_tracks')) {
        const store = db.createObjectStore('playlist_tracks', { keyPath: 'id' });
        store.createIndex('playlist_id', 'playlist_id', { unique: false });
        store.createIndex('track_id', 'track_id', { unique: false });
      }

      if (!db.objectStoreNames.contains('playback_state')) {
        db.createObjectStore('playback_state', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    request.onblocked = () => reject(new Error('IndexedDB upgrade is blocked by another tab'));
  });

  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

async function withStores<T extends StoreName[], R>(
  storeNames: T,
  mode: IDBTransactionMode,
  handler: (stores: Pick<StoreMap, T[number]>) => Promise<R> | R
): Promise<R> {
  const db = await openDatabase();

  return await new Promise<R>((resolve, reject) => {
    const tx = db.transaction(storeNames, mode);
    const stores: Partial<StoreMap> = {};

    storeNames.forEach((name) => {
      stores[name] = tx.objectStore(name);
    });

    let resultValue: R;

    const runHandler = async () => {
      try {
        resultValue = await handler(stores as Pick<StoreMap, T[number]>);
      } catch (error) {
        tx.abort();
        reject(error);
      }
    };

    runHandler();

    tx.oncomplete = () => resolve(resultValue!);
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

function lower(value?: string | null) {
  return value?.toLowerCase() ?? null;
}

function now() {
  return Date.now();
}

function makeTitleArtistKey(title: string, artistId: string) {
  return `${title.toLowerCase()}::${artistId}`;
}

async function getAllFromStore<T>(store: IDBObjectStore): Promise<T[]> {
  return await requestToPromise(store.getAll());
}

export async function idbSaveArtists(artists: ArtistRecord[]) {
  if (!artists.length) return;

  await withStores(['artists'], 'readwrite', async ({ artists: store }) => {
    for (const artist of artists) {
      const existing = await requestToPromise<any | undefined>(store.get(artist.id));
      const createdAt = existing?.created_at ?? now();
      const payload = {
        id: artist.id,
        name: artist.name,
        sort_key: artist.sortKey,
        name_lower: lower(artist.name),
        created_at: createdAt,
        updated_at: now(),
      };
      await requestToPromise(store.put(payload));
    }
  });
}

export async function idbSaveAlbums(albums: AlbumRecord[]) {
  if (!albums.length) return;

  await withStores(['albums'], 'readwrite', async ({ albums: store }) => {
    for (const album of albums) {
      const existing = await requestToPromise<any | undefined>(store.get(album.id));
      const createdAt = existing?.created_at ?? now();
      const payload = {
        id: album.id,
        artist_id: album.artistId,
        title: album.title,
        sort_key: album.sortKey,
        year: album.year ?? null,
        artwork_uri: album.artworkUri ?? null,
        primary_color: album.primaryColor ?? null,
        created_at: createdAt,
        updated_at: now(),
      };
      await requestToPromise(store.put(payload));
    }
  });
}

export async function idbSaveTracks(tracks: TrackRecord[]) {
  if (!tracks.length) return;

  await withStores(['tracks', 'artists'], 'readwrite', async ({ tracks: store, artists }) => {
    for (const track of tracks) {
      const existing = await requestToPromise<any | undefined>(store.get(track.id));
      const createdAt = existing?.created_at ?? now();
      const artist = await requestToPromise<any | undefined>(artists.get(track.artistId));
      const payload = {
        id: track.id,
        album_id: track.albumId,
        artist_id: track.artistId,
        title: track.title,
        duration_ms: track.durationMs ?? null,
        disc_number: track.discNumber ?? null,
        track_number: track.trackNumber ?? null,
        bitrate: track.bitrate ?? null,
        sample_rate: track.sampleRate ?? null,
        genre: track.genre ?? null,
        file_uri: track.fileUri,
        file_mtime: track.fileMtime ?? null,
        file_size: track.fileSize ?? null,
        hash: track.hash ?? null,
        is_deleted: existing?.is_deleted ?? 0,
        created_at: createdAt,
        updated_at: now(),
        title_artist_key: makeTitleArtistKey(track.title, track.artistId),
        artist_name_lower: artist?.name?.toLowerCase() ?? null,
      };
      await requestToPromise(store.put(payload));
    }
  });
}

export async function idbMarkTracksAsDeleted(trackIds: string[]) {
  if (!trackIds.length) return;

  await withStores(['tracks'], 'readwrite', async ({ tracks }) => {
    for (const id of trackIds) {
      const record = await requestToPromise<any | undefined>(tracks.get(id));
      if (!record) continue;
      record.is_deleted = 1;
      record.updated_at = now();
      await requestToPromise(tracks.put(record));
    }
  });
}

export async function idbDeleteTrack(trackId: string) {
  await withStores(['tracks'], 'readwrite', async ({ tracks }) => {
    await requestToPromise(tracks.delete(trackId));
  });
}

export async function idbUpdateTrackFileUri(trackId: string, fileUri: string) {
  await withStores(['tracks'], 'readwrite', async ({ tracks }) => {
    const record = await requestToPromise<any | undefined>(tracks.get(trackId));
    if (!record) return;
    record.file_uri = fileUri;
    record.updated_at = now();
    await requestToPromise(tracks.put(record));
  });
}

export async function idbUpdateTrackDuration(trackId: string, durationMs: number) {
  await withStores(['tracks'], 'readwrite', async ({ tracks }) => {
    const record = await requestToPromise<any | undefined>(tracks.get(trackId));
    if (!record) return;
    record.duration_ms = durationMs;
    record.updated_at = now();
    await requestToPromise(tracks.put(record));
  });
}

export async function idbClearLibrary() {
  await withStores(
    ['playlist_tracks', 'playlists', 'playback_state', 'tracks', 'albums', 'artists'],
    'readwrite',
    async ({ playlist_tracks, playlists, playback_state, tracks, albums, artists }) => {
      await Promise.all([
        requestToPromise(playlist_tracks.clear()),
        requestToPromise(playlists.clear()),
        requestToPromise(playback_state.clear()),
        requestToPromise(tracks.clear()),
        requestToPromise(albums.clear()),
        requestToPromise(artists.clear()),
      ]);
    }
  );
}

export interface LibrarySnapshotItem {
  id: string;
  albumId: string;
  artistId: string;
  title: string;
  durationMs: number | null;
  discNumber: number | null;
  trackNumber: number | null;
  bitrate: number | null;
  sampleRate: number | null;
  genres: string[] | null;
  fileUri: string;
  fileMtime: number | null;
  fileSize: number | null;
  hash: string | null;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
  album: { id: string; title: string } | null;
  artist: { id: string; name: string } | null;
}

export async function idbFetchLibrarySnapshot(): Promise<LibrarySnapshotItem[]> {
  return await withStores(['tracks', 'artists', 'albums'], 'readonly', async ({ tracks, artists, albums }) => {
    const [trackRows, artistRows, albumRows] = await Promise.all([
      getAllFromStore<any>(tracks),
      getAllFromStore<any>(artists),
      getAllFromStore<any>(albums),
    ]);

    const artistMap = new Map<string, any>(artistRows.map((a) => [a.id, a]));
    const albumMap = new Map<string, any>(albumRows.map((a) => [a.id, a]));

    return trackRows
      .filter((t) => t.is_deleted !== 1)
      .map<LibrarySnapshotItem>((track) => {
        // Parse genres from JSON string to array
        let genres: string[] | null = null;
        if (track.genre) {
          try {
            const parsed = JSON.parse(track.genre);
            if (Array.isArray(parsed)) {
              genres = parsed;
            } else if (typeof parsed === 'string') {
              // Handle legacy single genre string
              genres = [parsed];
            }
          } catch (e) {
            // If parsing fails, treat as legacy single genre string
            genres = [track.genre];
          }
        }
        
        return {
          id: track.id,
          albumId: track.album_id,
          artistId: track.artist_id,
          title: track.title,
          durationMs: track.duration_ms ?? null,
          discNumber: track.disc_number ?? null,
          trackNumber: track.track_number ?? null,
          bitrate: track.bitrate ?? null,
          sampleRate: track.sample_rate ?? null,
          genres,
          fileUri: track.file_uri,
          fileMtime: track.file_mtime ?? null,
          fileSize: track.file_size ?? null,
          hash: track.hash ?? null,
          isDeleted: track.is_deleted === 1,
          createdAt: track.created_at ?? 0,
          updatedAt: track.updated_at ?? 0,
          album: track.album_id ? (albumMap.get(track.album_id)
            ? { id: track.album_id, title: albumMap.get(track.album_id).title }
            : null) : null,
          artist: track.artist_id ? (artistMap.get(track.artist_id)
            ? { id: track.artist_id, name: artistMap.get(track.artist_id).name }
            : null) : null,
        };
      });
  });
}

export async function idbFindTrackByFile(uri: string, mtime?: number | null) {
  return await withStores(['tracks'], 'readonly', async ({ tracks }) => {
    const index = tracks.index('file_uri');
    const matches = await requestToPromise<any[]>(index.getAll(IDBKeyRange.only(uri)));
    if (!matches.length) return null;
    if (typeof mtime === 'number') {
      return matches.find((item) => item.file_mtime === mtime) ?? null;
    }
    return matches[0] ?? null;
  });
}

export async function idbCheckTrackExists(title: string, artistName: string): Promise<boolean> {
  const artistLower = artistName.toLowerCase();
  const titleLower = title.toLowerCase();

  return await withStores(['tracks'], 'readonly', async ({ tracks }) => {
    const cursorRequest = tracks.openCursor();
    return await new Promise<boolean>((resolve, reject) => {
      cursorRequest.onerror = () => reject(cursorRequest.error ?? new Error('IndexedDB cursor failed'));
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (!cursor) {
          resolve(false);
          return;
        }
        const value = cursor.value;
        if (
          value.is_deleted !== 1 &&
          value.title?.toLowerCase() === titleLower &&
          value.artist_name_lower === artistLower
        ) {
          resolve(true);
          return;
        }
        cursor.continue();
      };
    });
  });
}

export async function idbGetPlaybackState() {
  return await withStores(['playback_state'], 'readonly', async ({ playback_state }) => {
    const record = await requestToPromise<any | undefined>(playback_state.get('singleton'));
    return record ?? null;
  });
}

export async function idbPersistPlaybackState(payload: PlaybackStateRecord) {
  await withStores(['playback_state'], 'readwrite', async ({ playback_state }) => {
    const record = {
      id: 'singleton',
      active_track_id: payload.activeTrackId ?? null,
      position_ms: payload.positionMs,
      volume: payload.volume,
      is_muted: payload.isMuted ? 1 : 0,
      updated_at: now(),
    };
    await requestToPromise(playback_state.put(record));
  });
}

export interface PlaylistRecord {
  id: string;
  name: string;
  description: string | null;
  cover_image_uri: string | null;
  is_system_playlist: number;
  created_at: number;
  updated_at: number;
}

export interface PlaylistTrackRecord {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: number;
}

export interface PlaylistWithTracksResult {
  playlist: PlaylistRecord;
  entries: PlaylistTrackRecord[];
  tracks: Map<string, any>;
}

export async function idbCreatePlaylist(record: CreatePlaylistRecord) {
  const ts = now();
  const payload: PlaylistRecord = {
    id: record.id,
    name: record.name,
    description: record.description ?? null,
    cover_image_uri: record.coverImageUri ?? null,
    is_system_playlist: 0,
    created_at: ts,
    updated_at: ts,
  };

  await withStores(['playlists'], 'readwrite', async ({ playlists }) => {
    await requestToPromise(playlists.put(payload));
  });
}

export async function idbUpdatePlaylist(
  playlistId: string,
  data: Partial<Omit<CreatePlaylistRecord, 'id'>>
) {
  await withStores(['playlists'], 'readwrite', async ({ playlists }) => {
    const existing = await requestToPromise<PlaylistRecord | undefined>(playlists.get(playlistId));
    if (!existing) return;
    const updated = {
      ...existing,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      cover_image_uri: data.coverImageUri ?? existing.cover_image_uri,
      updated_at: now(),
    };
    await requestToPromise(playlists.put(updated));
  });
}

export async function idbDeletePlaylist(playlistId: string) {
  await withStores(['playlists', 'playlist_tracks'], 'readwrite', async ({ playlists, playlist_tracks }) => {
    await requestToPromise(playlists.delete(playlistId));

    const index = playlist_tracks.index('playlist_id');
    const toDelete = await requestToPromise<any[]>(index.getAll(IDBKeyRange.only(playlistId)));
    await Promise.all(toDelete.map((row) => requestToPromise(playlist_tracks.delete(row.id))));
  });
}

export async function idbClearPlaylists() {
  await withStores(['playlists', 'playlist_tracks'], 'readwrite', async ({ playlists, playlist_tracks }) => {
    await Promise.all([
      requestToPromise(playlists.clear()),
      requestToPromise(playlist_tracks.clear()),
    ]);
  });
}

export async function idbGetAllPlaylists() {
  return await withStores(['playlists', 'playlist_tracks'], 'readonly', async ({ playlists, playlist_tracks }) => {
    const playlistRows = await getAllFromStore<PlaylistRecord>(playlists);
    
    // Get track counts for each playlist
    const playlistsWithTrackCounts = await Promise.all(
      playlistRows.map(async (playlist) => {
        const trackEntries = await requestToPromise<PlaylistTrackRecord[]>(
          playlist_tracks.index('playlist_id').getAll(IDBKeyRange.only(playlist.id))
        );
        return {
          ...playlist,
          playlistTracks: trackEntries,
        };
      })
    );
    
    return playlistsWithTrackCounts.sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));
  });
}

export async function idbGetPlaylistWithTracks(playlistId: string): Promise<PlaylistWithTracksResult | null> {
  return await withStores(['playlists', 'playlist_tracks', 'tracks'], 'readonly', async ({ playlists, playlist_tracks, tracks }) => {
    const playlist = await requestToPromise<PlaylistRecord | undefined>(playlists.get(playlistId));
    if (!playlist) return null;

    const playlistEntries = await requestToPromise<PlaylistTrackRecord[]>(
      playlist_tracks.index('playlist_id').getAll(IDBKeyRange.only(playlistId))
    );
    playlistEntries.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

    const tracksMap = new Map<string, any>();
    await Promise.all(
      playlistEntries.map(async (entry) => {
        if (!tracksMap.has(entry.track_id)) {
          const track = await requestToPromise<any | undefined>(tracks.get(entry.track_id));
          if (track) tracksMap.set(entry.track_id, track);
        }
      })
    );

    return {
      playlist,
      entries: playlistEntries,
      tracks: tracksMap,
    };
  });
}

export async function idbAddTrackToPlaylist(record: PlaylistTrackRecord) {
  await withStores(['playlist_tracks'], 'readwrite', async ({ playlist_tracks }) => {
    await requestToPromise(playlist_tracks.put(record));
  });
}

export async function idbRemoveTrackFromPlaylist(playlistId: string, trackId: string) {
  await withStores(['playlist_tracks'], 'readwrite', async ({ playlist_tracks }) => {
    const index = playlist_tracks.index('playlist_id');
    const existing = await requestToPromise<PlaylistTrackRecord[]>(
      index.getAll(IDBKeyRange.only(playlistId))
    );
    const target = existing.find((row) => row.track_id === trackId);
    if (target) {
      await requestToPromise(playlist_tracks.delete(target.id));
    }
  });
}

export async function idbIsTrackInPlaylist(playlistId: string, trackId: string): Promise<boolean> {
  return await withStores(['playlist_tracks'], 'readonly', async ({ playlist_tracks }) => {
    const index = playlist_tracks.index('playlist_id');
    const existing = await requestToPromise<PlaylistTrackRecord[]>(
      index.getAll(IDBKeyRange.only(playlistId))
    );
    return existing.some(entry => entry.track_id === trackId);
  });
}

export async function idbNextPlaylistPosition(playlistId: string): Promise<number> {
  return await withStores(['playlist_tracks'], 'readonly', async ({ playlist_tracks }) => {
    const index = playlist_tracks.index('playlist_id');
    const existing = await requestToPromise<PlaylistTrackRecord[]>(
      index.getAll(IDBKeyRange.only(playlistId))
    );
    if (!existing.length) return 1;
    const max = existing.reduce((acc, item) => Math.max(acc, item.position ?? 0), 0);
    return max + 1;
  });
}

export function resetIndexedDbCache() {
  dbPromise = null;
}
