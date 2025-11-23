# Services Layer Documentation

## Overview

The services layer contains business logic and orchestrates interactions between the UI, state management, and data layers. Services are located in `src/services/` and provide high-level APIs for common operations.

## Service Architecture

```
┌─────────────────────────────────────┐
│      UI Components                  │
│  (call service functions)           │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Services Layer                 │
│  - Library Service                  │
│  - Playback Service                 │
│  - Playlist Service                 │
│  - File Scanner                      │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      State Management               │
│  (update Zustand stores)            │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Repository Layer               │
│  (database operations)              │
└─────────────────────────────────────┘
```

## Library Service

**File:** `src/services/library-service.ts`

Manages music library operations - importing, deleting, and syncing tracks.

### Functions

#### `hydrateLibraryFromDatabase()`

Loads all tracks from the database into the library store.

```typescript
export async function hydrateLibraryFromDatabase(): Promise<void>
```

**Behavior:**
1. Sets loading state to `true`
2. Fetches all non-deleted tracks from database
3. Updates library store with fetched tracks
4. Sets loading state to `false`

**Usage:**
```typescript
// On app startup
useEffect(() => {
  hydrateLibraryFromDatabase();
}, []);

// After importing tracks
await scanMusicFiles();
await hydrateLibraryFromDatabase();
```

#### `upsertLibrary(records)`

Inserts or updates library records in batch.

```typescript
export async function upsertLibrary(
  records: LibraryBatchUpsert
): Promise<void>
```

**Parameters:**
- `records`: Object containing `artists`, `albums`, and `tracks` arrays

**Behavior:**
1. Saves records to database (platform-specific)
2. Automatically hydrates library store

**Usage:**
```typescript
await upsertLibrary({
  artists: [{ id: '1', name: 'Artist', sortKey: 'artist' }],
  albums: [{ id: '1', artistId: '1', title: 'Album', sortKey: 'album' }],
  tracks: [{ id: '1', albumId: '1', artistId: '1', title: 'Track', fileUri: '...' }]
});
```

#### `deleteTrack(trackId)`

Permanently deletes a track from the library.

```typescript
export async function deleteTrack(trackId: string): Promise<void>
```

**Behavior:**
1. Deletes track from database
2. Automatically hydrates library store

**Usage:**
```typescript
await deleteTrack('track-id-123');
```

#### `clearLibrary()`

Removes all tracks, albums, and artists from the library.

```typescript
export async function clearLibrary(): Promise<void>
```

**Behavior:**
1. Clears all library data from database
2. Automatically hydrates library store (will be empty)

**Usage:**
```typescript
// With user confirmation
if (confirm('Clear entire library?')) {
  await clearLibrary();
}
```

## Playback Service

**File:** `src/services/playback-service.ts`

Manages audio playback - playing tracks, controlling playback, and managing player state.

### Setup

The playback service requires a player callback to be set from a React component:

```typescript
// In AudioPlaybackProvider component
useEffect(() => {
  setPlayerCallback((track) => {
    player.replace(track.fileUri);
    setCurrentPlayer(player, track);
  });
}, [player]);
```

### Functions

#### `playTrack(track)`

Starts playback of a track.

```typescript
export async function playTrack(track: LibraryTrack): Promise<void>
```

**Behavior:**
1. Cleans up existing player if any
2. Converts track URI to playable format (web: data URI)
3. Calls player callback to create new player
4. Updates player store with active track

**Platform-Specific:**
- **Web**: Converts blob/file URIs to data URIs for playback
- **Native**: Uses file URIs directly

**Usage:**
```typescript
const track = tracks[0];
await playTrack(track);
```

#### `setCurrentPlayer(player, track)`

Internal function that sets up the active player instance.

```typescript
export function setCurrentPlayer(
  player: ReturnType<typeof useAudioPlayer>,
  track: LibraryTrack
): void
```

**Behavior:**
1. Starts playback
2. Sets up status update interval (500ms)
3. Updates player store with track and status

#### `togglePlayPause()`

Toggles between play and pause states.

```typescript
export async function togglePlayPause(): Promise<void>
```

**Usage:**
```typescript
<Button onPress={togglePlayPause}>
  {isPlaying ? 'Pause' : 'Play'}
</Button>
```

#### `seekTo(positionMs)`

Seeks to a specific position in the current track.

```typescript
export async function seekTo(positionMs: number): Promise<void>
```

**Parameters:**
- `positionMs`: Position in milliseconds (0 to track duration)

**Behavior:**
- Clamps position to valid range [0, duration]
- Updates player position
- Does not update store (store updates via status interval)

**Usage:**
```typescript
// Seek to 30 seconds
await seekTo(30000);
```

#### `setVolume(volume)`

Sets playback volume.

```typescript
export async function setVolume(volume: number): Promise<void>
```

**Parameters:**
- `volume`: Volume level (0.0 to 1.0)

**Behavior:**
1. Clamps volume to [0, 1]
2. Updates player volume
3. Updates player store

**Usage:**
```typescript
await setVolume(0.5); // 50% volume
```

#### `skipNext()`

Plays the next track in the library.

```typescript
export async function skipNext(): Promise<void>
```

**Behavior:**
1. Finds current track index in library
2. Plays next track (wraps to beginning if at end)

**Usage:**
```typescript
<Button onPress={skipNext}>Next</Button>
```

#### `skipPrevious()`

Plays the previous track, or restarts current track if less than 2 seconds in.

```typescript
export async function skipPrevious(): Promise<void>
```

**Behavior:**
- If position > 2 seconds: Restarts current track
- Otherwise: Plays previous track (wraps to end if at beginning)

**Usage:**
```typescript
<Button onPress={skipPrevious}>Previous</Button>
```

#### `unloadPlayback()`

Stops playback and cleans up player.

```typescript
export async function unloadPlayback(): Promise<void>
```

**Behavior:**
1. Pauses player
2. Clears status update interval
3. Resets player store

## Playlist Service

**File:** `src/services/playlist-service.ts`

Manages playlist operations - creating, updating, and managing playlists.

### Functions

#### `hydratePlaylistsFromDatabase()`

Loads all playlists from the database into the playlist store.

```typescript
export async function hydratePlaylistsFromDatabase(): Promise<void>
```

**Usage:**
```typescript
useEffect(() => {
  hydratePlaylistsFromDatabase();
}, []);
```

#### `createNewPlaylist(data)`

Creates a new playlist.

```typescript
export async function createNewPlaylist(
  data: CreatePlaylistData
): Promise<string>
```

**Parameters:**
- `data.name`: Playlist name (required)
- `data.description`: Optional description
- `data.coverImageUri`: Optional cover image URI

**Returns:** Playlist ID

**Usage:**
```typescript
const playlistId = await createNewPlaylist({
  name: 'My Playlist',
  description: 'Favorite songs'
});
```

#### `addTrackToPlaylistById(playlistId, trackId)`

Adds a track to a playlist.

```typescript
export async function addTrackToPlaylistById(
  playlistId: string,
  trackId: string
): Promise<void>
```

**Usage:**
```typescript
await addTrackToPlaylistById('playlist-123', 'track-456');
```

#### `removeTrackFromPlaylistById(playlistId, trackId)`

Removes a track from a playlist.

```typescript
export async function removeTrackFromPlaylistById(
  playlistId: string,
  trackId: string
): Promise<void>
```

#### `deletePlaylistById(playlistId)`

Deletes a playlist permanently.

```typescript
export async function deletePlaylistById(playlistId: string): Promise<void>
```

**Behavior:**
- Deletes playlist and all associated track entries
- Refreshes playlist store

#### `updatePlaylistById(playlistId, data)`

Updates playlist metadata.

```typescript
export async function updatePlaylistById(
  playlistId: string,
  data: Partial<CreatePlaylistData>
): Promise<void>
```

**Usage:**
```typescript
await updatePlaylistById('playlist-123', {
  name: 'Updated Name',
  description: 'New description'
});
```

#### `getPlaylistDetails(playlistId)`

Fetches full playlist details including tracks.

```typescript
export async function getPlaylistDetails(
  playlistId: string
): Promise<PlaylistWithTracks | null>
```

**Returns:** Playlist object with tracks array, or null if not found

**Usage:**
```typescript
const playlist = await getPlaylistDetails('playlist-123');
if (playlist) {
  console.log(`${playlist.tracks.length} tracks`);
}
```

## File Scanner Service

**File:** `src/services/file-scanner.ts`

Scans directories and files for music, extracts metadata, and imports tracks.

### Class: `FileScanner`

Main class for scanning and processing music files.

#### Constructor

```typescript
constructor(
  onProgress?: (progress: ScanProgress) => void,
  onComplete?: (summary: ScanSummary) => void,
  onError?: (error: Error) => void
)
```

**Callbacks:**
- `onProgress`: Called during scanning with progress updates
- `onComplete`: Called when scanning completes with summary
- `onError`: Called if an error occurs

#### Methods

##### `scanDirectory(directoryUri)`

Recursively scans a directory for music files.

```typescript
async scanDirectory(directoryUri: string): Promise<void>
```

**Supported Formats:**
- `.mp3`, `.m4a`, `.mp4`, `.flac`, `.wav`, `.aac`, `.ogg`, `.wma`

**Behavior:**
1. Recursively finds all music files
2. Processes files in batches of 20
3. Extracts metadata from each file
4. Checks for duplicates
5. Saves to database via `upsertLibrary()`

##### `processMusicFiles(files)`

Processes an array of music files.

```typescript
async processMusicFiles(files: MusicFile[]): Promise<void>
```

**Process:**
1. Groups files into batches of 20
2. For each file:
   - Extracts metadata (from file or filename)
   - Checks for duplicates
   - Creates/gets artist and album records
   - Converts file to data URI (web only)
   - Creates track record
3. Saves each batch to database
4. Calls completion callback with summary

**Metadata Extraction:**
1. **Primary**: Uses `music-metadata` library to read audio file tags
2. **Fallback**: Parses filename pattern (`Artist - Album - Title`)

**Duplicate Detection:**
- Checks by title and artist name
- Skips files that already exist

**Web-Specific:**
- Converts files to base64 data URIs for storage
- Handles File objects from folder selection

#### Private Methods

- `findMusicFiles()` - Recursively finds music files
- `isMusicFile()` - Checks file extension
- `extractMetadataFromFile()` - Extracts metadata using music-metadata
- `extractMetadataFromFilenameFallback()` - Fallback filename parsing
- `convertToDataUri()` - Converts files to data URIs (web)
- `generateId()` - Generates consistent IDs from strings
- `sanitizeString()` - Sanitizes strings for database storage

### Usage Example

```typescript
const scanner = new FileScanner(
  (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
  },
  (summary) => {
    console.log(`Added: ${summary.added}, Skipped: ${summary.skipped}`);
  },
  (error) => {
    console.error('Scan error:', error);
  }
);

// For web folder selection
await scanner.processMusicFiles(selectedFiles);

// For native directory scanning
await scanner.scanDirectory('/path/to/music');
```

## Error Handling

All services handle errors gracefully:

1. **Database Errors**: Logged to console, user-friendly alerts shown
2. **File Errors**: Individual file errors don't stop batch processing
3. **Playback Errors**: User-friendly alerts, fallback behavior

## Service Patterns

### 1. Automatic Store Updates

Most services automatically update Zustand stores after operations:

```typescript
export async function deleteTrack(trackId: string) {
  await deleteTrackPermanently(trackId);
  await hydrateLibraryFromDatabase(); // Auto-refresh
}
```

### 2. Batch Processing

File scanner processes files in batches to avoid blocking:

```typescript
const PROCESS_BATCH_SIZE = 20;
for (let batchStart = 0; batchStart < files.length; batchStart += PROCESS_BATCH_SIZE) {
  // Process batch
  await upsertLibrary(batch);
  await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
}
```

### 3. Platform-Specific Behavior

Services check platform and adapt behavior:

```typescript
if (Platform.OS === 'web') {
  // Web-specific logic
} else {
  // Native-specific logic
}
```

## Future Enhancements

- [ ] Background file scanning
- [ ] Progress persistence across app restarts
- [ ] Retry logic for failed operations
- [ ] Queue management for playback
- [ ] Shuffle and repeat modes
- [ ] Playlist import/export

