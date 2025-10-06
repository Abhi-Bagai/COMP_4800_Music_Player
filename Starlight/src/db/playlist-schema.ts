import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
  trackId: text('track_id').notNull(),
  position: integer('position').notNull(),
  addedAt: integer('added_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s','now')*1000)`),
});