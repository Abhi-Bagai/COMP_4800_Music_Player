import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { integer, numeric, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const artists = sqliteTable('artists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sortKey: text('sort_key').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
});

export const albums = sqliteTable('albums', {
  id: text('id').primaryKey(),
  artistId: text('artist_id')
    .notNull()
    .references(() => artists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  sortKey: text('sort_key').notNull(),
  year: integer('year'),
  artworkUri: text('artwork_uri'),
  primaryColor: text('primary_color'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
});

export const tracks = sqliteTable('tracks', {
  id: text('id').primaryKey(),
  albumId: text('album_id')
    .notNull()
    .references(() => albums.id, { onDelete: 'cascade' }),
  artistId: text('artist_id')
    .notNull()
    .references(() => artists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  durationMs: integer('duration_ms'),
  discNumber: integer('disc_number'),
  trackNumber: integer('track_number'),
  bitrate: integer('bitrate'),
  sampleRate: integer('sample_rate'),
  genre: text('genre'),
  fileUri: text('file_uri').notNull(),
  fileMtime: integer('file_mtime'),
  fileSize: integer('file_size'),
  hash: text('hash'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
});

export const playbackState = sqliteTable('playback_state', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  activeTrackId: text('active_track_id').references(() => tracks.id),
  positionMs: integer('position_ms').notNull().default(0),
  volume: numeric('volume').notNull().default('1'),
  isMuted: integer('is_muted', { mode: 'boolean' }).notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
});

export const playlists = sqliteTable('playlists', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  coverImageUri: text('cover_image_uri'),
  isSystemPlaylist: integer('is_system_playlist', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
});

export const playlistTracks = sqliteTable('playlist_tracks', {
  id: text('id').primaryKey(),
  playlistId: text('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  trackId: text('track_id').notNull().references(() => tracks.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  addedAt: integer('added_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
});

export type Artist = typeof artists.$inferSelect;
export type Album = typeof albums.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
export type PlaylistTrack = typeof playlistTracks.$inferSelect;

export const artistsRelations = relations(artists, ({ many }) => ({
  albums: many(albums),
  tracks: many(tracks),
}));

export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, {
    fields: [albums.artistId],
    references: [artists.id],
  }),
  tracks: many(tracks),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  album: one(albums, {
    fields: [tracks.albumId],
    references: [albums.id],
  }),
  artist: one(artists, {
    fields: [tracks.artistId],
    references: [artists.id],
  }),
  playlistTracks: many(playlistTracks),
}));

export const playlistsRelations = relations(playlists, ({ many }) => ({
  playlistTracks: many(playlistTracks),
}));

export const playlistTracksRelations = relations(playlistTracks, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistTracks.playlistId],
    references: [playlists.id],
  }),
  track: one(tracks, {
    fields: [playlistTracks.trackId],
    references: [tracks.id],
  }),
}));
