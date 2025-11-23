# Database Schema Documentation

## Overview

Starlight uses a relational database schema to store music library data, playlists, and playback state. The implementation supports two backends:
- **Native (iOS/Android)**: SQLite via Drizzle ORM
- **Web**: IndexedDB with custom abstraction layer

The schema is defined in `src/db/schema.ts` and uses Drizzle ORM for type-safe database operations.

## Schema Diagram

```
┌─────────────┐
│   artists   │
│─────────────│
│ id (PK)     │
│ name        │
│ sortKey     │
│ createdAt   │
│ updatedAt   │
└─────────────┘
       │
       │ 1:N
       │
┌─────────────┐      ┌─────────────┐
│   albums    │      │   tracks    │
│─────────────│      │─────────────│
│ id (PK)     │◄─────┤ id (PK)     │
│ artistId(FK)│      │ albumId(FK) │
│ title       │      │ artistId(FK)│
│ sortKey     │      │ title       │
│ year        │      │ durationMs  │
│ artworkUri  │      │ fileUri      │
│ primaryColor│      │ fileSize     │
│ createdAt   │      │ fileMtime   │
│ updatedAt   │      │ isDeleted    │
└─────────────┘      │ createdAt   │
                     │ updatedAt   │
                     └─────────────┘
                            │
                            │ N:M
                            │
                     ┌─────────────┐      ┌─────────────┐
                     │playlist_tracks│      │  playlists  │
                     │─────────────│      │─────────────│
                     │ id (PK)     │      │ id (PK)     │
                     │ playlistId  │◄─────┤ name        │
                     │ trackId     │      │ description │
                     │ position    │      │ coverImage  │
                     │ addedAt     │      │ createdAt   │
                     └─────────────┘      │ updatedAt   │
                                          └─────────────┘

┌─────────────┐
│playback_state│
│─────────────│
│ id (PK)     │
│ activeTrackId│
│ positionMs  │
│ volume      │
│ isMuted     │
│ updatedAt   │
└─────────────┘
```

## Tables

### `artists`

Stores artist information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PRIMARY KEY | Unique artist identifier |
| `name` | `text` | NOT NULL | Artist name |
| `sortKey` | `text` | NOT NULL | Lowercase name for sorting |
| `createdAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |
| `updatedAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |

**Relations:**
- One-to-many with `albums`
- One-to-many with `tracks`

**Indexes:**
- Primary key on `id`

### `albums`

Stores album information, linked to artists.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PRIMARY KEY | Unique album identifier |
| `artistId` | `text` | NOT NULL, FK → artists.id | Reference to artist |
| `title` | `text` | NOT NULL | Album title |
| `sortKey` | `text` | NOT NULL | Lowercase title for sorting |
| `year` | `integer` | NULLABLE | Release year |
| `artworkUri` | `text` | NULLABLE | Album artwork URI |
| `primaryColor` | `text` | NULLABLE | Dominant color from artwork |
| `createdAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |
| `updatedAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |

**Relations:**
- Many-to-one with `artists`
- One-to-many with `tracks`

**Cascade Deletes:**
- Deleting an artist deletes all associated albums
- Deleting an album deletes all associated tracks

### `tracks`

Stores track information, linked to albums and artists.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PRIMARY KEY | Unique track identifier |
| `albumId` | `text` | NOT NULL, FK → albums.id | Reference to album |
| `artistId` | `text` | NOT NULL, FK → artists.id | Reference to artist |
| `title` | `text` | NOT NULL | Track title |
| `durationMs` | `integer` | NULLABLE | Duration in milliseconds |
| `discNumber` | `integer` | NULLABLE | Disc number (for multi-disc albums) |
| `trackNumber` | `integer` | NULLABLE | Track number within disc |
| `bitrate` | `integer` | NULLABLE | Audio bitrate (kbps) |
| `sampleRate` | `integer` | NULLABLE | Audio sample rate (Hz) |
| `fileUri` | `text` | NOT NULL | File URI (platform-specific) |
| `fileMtime` | `integer` | NULLABLE | File modification time (seconds) |
| `fileSize` | `integer` | NULLABLE | File size in bytes |
| `hash` | `text` | NULLABLE | File hash for deduplication |
| `isDeleted` | `boolean` | NOT NULL, DEFAULT 0 | Soft delete flag |
| `createdAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |
| `updatedAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |

**Relations:**
- Many-to-one with `albums`
- Many-to-one with `artists`
- Many-to-many with `playlists` (via `playlist_tracks`)

**Cascade Deletes:**
- Deleting an album deletes all associated tracks
- Deleting an artist deletes all associated tracks
- Deleting a track removes it from all playlists

**File URI Formats:**
- **Web**: Data URIs (`data:audio/mpeg;base64,...`)
- **Native**: File system URIs (`file:///path/to/file.mp3`)

### `playlists`

Stores playlist information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PRIMARY KEY | Unique playlist identifier |
| `name` | `text` | NOT NULL | Playlist name |
| `description` | `text` | NULLABLE | Playlist description |
| `coverImageUri` | `text` | NULLABLE | Cover image URI |
| `isSystemPlaylist` | `boolean` | NOT NULL, DEFAULT false | System vs user playlist |
| `createdAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |
| `updatedAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |

**Relations:**
- One-to-many with `playlist_tracks`

**System Playlists:**
- Reserved for future system-generated playlists (e.g., "Recently Played", "Favorites")

### `playlist_tracks`

Junction table linking playlists to tracks with ordering.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `text` | PRIMARY KEY | Unique entry identifier |
| `playlistId` | `text` | NOT NULL, FK → playlists.id | Reference to playlist |
| `trackId` | `text` | NOT NULL, FK → tracks.id | Reference to track |
| `position` | `integer` | NOT NULL | Play order (1-based) |
| `addedAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |

**Relations:**
- Many-to-one with `playlists`
- Many-to-one with `tracks`

**Cascade Deletes:**
- Deleting a playlist removes all entries
- Deleting a track removes it from all playlists

**Ordering:**
- Tracks are ordered by `position` field
- New tracks are appended with `position = max(position) + 1`

### `playback_state`

Stores current playback state (singleton table).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `integer` | PRIMARY KEY, AUTO_INCREMENT | Row identifier (always 1) |
| `activeTrackId` | `text` | NULLABLE, FK → tracks.id | Currently playing track |
| `positionMs` | `integer` | NOT NULL, DEFAULT 0 | Playback position (milliseconds) |
| `volume` | `numeric` | NOT NULL, DEFAULT 1 | Volume level (0.0-1.0) |
| `isMuted` | `boolean` | NOT NULL, DEFAULT 0 | Mute state |
| `updatedAt` | `integer` | NOT NULL, DEFAULT | Timestamp (milliseconds) |

**Usage:**
- Only one row should exist (singleton pattern)
- Persists playback state across app restarts
- Updated during playback to maintain position

## Platform-Specific Implementations

### Native (SQLite)

- Uses `expo-sqlite` for database access
- Drizzle ORM provides type-safe queries
- Full relational integrity with foreign keys
- Transactions supported for batch operations

**Database Location:**
- iOS: App's Documents directory
- Android: App's data directory
- Database name: `starlight.db`

### Web (IndexedDB)

- Custom IndexedDB implementation in `src/db/indexeddb.ts`
- Mirrors SQLite schema structure
- Object stores replace tables
- Indexes for efficient queries

**Database Details:**
- Database name: `starlight-indexeddb`
- Version: 1
- Object stores: `artists`, `albums`, `tracks`, `playlists`, `playlist_tracks`, `playback_state`

**Key Differences:**
- No foreign key constraints (enforced in application code)
- No transactions across multiple stores (limited by IndexedDB API)
- String-based keys instead of auto-increment integers

## Data Access Patterns

### Repository Pattern

All database access goes through repository functions:

- `src/db/library-repository.ts` - Library operations
- `src/db/playlist-repository.ts` - Playlist operations  
- `src/db/playback-repository.ts` - Playback state operations

### Example Queries

**Fetch all tracks with relations:**
```typescript
const tracks = await db.query.tracks.findMany({
  where: eq(schema.tracks.isDeleted, false),
  with: {
    album: true,
    artist: true,
  },
});
```

**Create playlist with tracks:**
```typescript
// 1. Create playlist
const playlistId = await createPlaylist({ name: "My Playlist" });

// 2. Add tracks
await addTrackToPlaylist(playlistId, trackId1);
await addTrackToPlaylist(playlistId, trackId2);
```

## Migration Strategy

Currently, migrations are handled via:
- `src/db/migrations/sql.ts` - SQL migration runner
- Initial schema creation on first app launch

**Future Considerations:**
- Use Drizzle Kit migrations for schema versioning
- Support incremental migrations
- Data migration utilities for breaking changes

## Performance Considerations

1. **Batch Operations**: Use batch inserts for large imports (20 tracks per batch)
2. **Indexes**: Ensure indexes on frequently queried fields
3. **Soft Deletes**: Use `isDeleted` flag instead of hard deletes for tracks
4. **Lazy Loading**: Load relations only when needed
5. **Pagination**: Consider pagination for large libraries (not yet implemented)

## Data Integrity

### Constraints
- Foreign key relationships ensure referential integrity
- NOT NULL constraints on required fields
- Unique constraints on primary keys

### Validation
- Repository functions validate data before insertion
- File URI validation for track files
- Sanitization of user input (playlist names, etc.)

## Backup and Export

**Not yet implemented**, but considerations:
- Export library to JSON format
- Import library from backup
- Sync across devices (future feature)

