# State Management Documentation

## Overview

Starlight uses **Zustand** for state management, providing lightweight, performant global state. The application has three main stores that manage different aspects of the app's state.

## Architecture

```
┌─────────────────────────────────────────┐
│         React Components                 │
│  (use hooks to access stores)            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Zustand Stores                   │
│  - Library Store                         │
│  - Player Store                          │
│  - Playlist Store                        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Services Layer                   │
│  (update stores via actions)             │
└─────────────────────────────────────────┘
```

## Store Structure

All stores are located in `src/state/` and exported through `src/state/index.ts`.

### Library Store

**File:** `src/state/library-store.ts`

Manages the music library state - all tracks in the user's library.

```typescript
interface LibraryState {
  tracks: LibraryTrack[];
  isLoading: boolean;
  lastSyncedAt?: number;
  setTracks: (tracks: LibraryTrack[]) => void;
  setLoading: (loading: boolean) => void;
}
```

**State Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `tracks` | `LibraryTrack[]` | Array of all tracks in the library |
| `isLoading` | `boolean` | Loading state for library operations |
| `lastSyncedAt` | `number?` | Timestamp of last sync with database |

**Actions:**

- `setTracks(tracks)` - Updates the tracks array and sets `lastSyncedAt` to current time
- `setLoading(loading)` - Updates loading state

**Usage Example:**

```typescript
import { useLibraryStore } from '@/src/state';

function MyComponent() {
  const { tracks, isLoading } = useLibraryStore();
  
  if (isLoading) return <Loading />;
  return <TrackList tracks={tracks} />;
}
```

**Data Flow:**

1. Component calls service function (e.g., `hydrateLibraryFromDatabase()`)
2. Service fetches data from database
3. Service calls `useLibraryStore.getState().setTracks(data)`
4. Components using `useLibraryStore()` automatically re-render

### Player Store

**File:** `src/state/player-store.ts`

Manages audio playback state - current track, playback status, queue, and controls.

```typescript
interface PlayerState {
  queue: QueueItem[];
  activeTrack: LibraryTrack | null;
  isPlaying: boolean;
  positionMs: number;
  volume: number;
  isMuted: boolean;
  scrubbingPositionMs: number | null;
  setQueue: (queue: QueueItem[]) => void;
  setActiveTrack: (track: LibraryTrack | null) => void;
  setPlaybackStatus: (status: { isPlaying?: boolean; positionMs?: number }) => void;
  setVolume: (volume: number, isMuted?: boolean) => void;
  setScrubbingPosition: (positionMs: number | null) => void;
}
```

**State Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `queue` | `QueueItem[]` | Playback queue (currently single-item) |
| `activeTrack` | `LibraryTrack \| null` | Currently playing track |
| `isPlaying` | `boolean` | Playback state (playing/paused) |
| `positionMs` | `number` | Current playback position in milliseconds |
| `volume` | `number` | Volume level (0.0 to 1.0) |
| `isMuted` | `boolean` | Mute state |
| `scrubbingPositionMs` | `number \| null` | Temporary position during scrubbing |

**Actions:**

- `setQueue(queue)` - Updates the playback queue
- `setActiveTrack(track)` - Sets the currently playing track
- `setPlaybackStatus({ isPlaying?, positionMs? })` - Updates playback status
- `setVolume(volume, isMuted?)` - Updates volume and mute state
- `setScrubbingPosition(positionMs)` - Sets temporary scrubbing position

**Usage Example:**

```typescript
import { usePlayerStore } from '@/src/state';

function PlaybackControls() {
  const { activeTrack, isPlaying, positionMs } = usePlayerStore();
  const { togglePlayPause } = usePlaybackService();
  
  return (
    <View>
      <Text>{activeTrack?.title}</Text>
      <Button onPress={togglePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
    </View>
  );
}
```

**Update Frequency:**

- `positionMs` is updated every 500ms during playback
- `isPlaying` is updated when playback state changes
- `scrubbingPositionMs` is updated during user scrubbing, then cleared

### Playlist Store

**File:** `src/state/playlist-store.ts`

Manages playlist summaries - list of all playlists with metadata.

```typescript
interface PlaylistState {
  playlists: PlaylistSummary[];
  isLoading: boolean;
  setPlaylists: (playlists: PlaylistSummary[]) => void;
  setLoading: (loading: boolean) => void;
}

interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  coverImageUri: string | null;
  isSystemPlaylist: boolean;
  createdAt: Date;
  updatedAt: Date;
  trackCount: number;
}
```

**State Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `playlists` | `PlaylistSummary[]` | Array of all playlists |
| `isLoading` | `boolean` | Loading state for playlist operations |

**Actions:**

- `setPlaylists(playlists)` - Updates the playlists array
- `setLoading(isLoading)` - Updates loading state

**Usage Example:**

```typescript
import { usePlaylistStore } from '@/src/state';

function PlaylistList() {
  const { playlists, isLoading } = usePlaylistStore();
  
  return (
    <FlatList
      data={playlists}
      renderItem={({ item }) => <PlaylistItem playlist={item} />}
    />
  );
}
```

**Note:** Full playlist details (with tracks) are fetched on-demand via `getPlaylistDetails()` service function, not stored in the global state.

## State Synchronization

### Hydration Pattern

Stores are "hydrated" from the database on app startup and after mutations:

```typescript
// On app mount
useEffect(() => {
  hydrateLibraryFromDatabase();
  hydratePlaylistsFromDatabase();
}, []);

// After adding tracks
await upsertLibrary(batch);
await hydrateLibraryFromDatabase(); // Refresh store
```

### Service-Store Integration

Services update stores directly:

```typescript
// In library-service.ts
export async function hydrateLibraryFromDatabase() {
  const setTracks = useLibraryStore.getState().setTracks;
  const setLoading = useLibraryStore.getState().setLoading;
  
  setLoading(true);
  try {
    const tracks = await fetchLibrarySnapshot();
    setTracks(tracks);
  } finally {
    setLoading(false);
  }
}
```

## Best Practices

### 1. Use Hooks in Components

Always use Zustand hooks in components, never access stores directly:

```typescript
// ✅ Good
const { tracks } = useLibraryStore();

// ❌ Bad
const tracks = useLibraryStore.getState().tracks;
```

### 2. Update State Through Actions

Always use store actions to update state:

```typescript
// ✅ Good
useLibraryStore.getState().setTracks(newTracks);

// ❌ Bad
useLibraryStore.setState({ tracks: newTracks });
```

### 3. Keep Stores Focused

Each store should manage a single domain:
- Library Store = Library data
- Player Store = Playback state
- Playlist Store = Playlist metadata

### 4. Avoid Storing Derived Data

Don't store computed values in stores. Compute them in components:

```typescript
// ✅ Good - Compute in component
const albumCount = useMemo(() => {
  const albums = new Set(tracks.map(t => t.albumId));
  return albums.size;
}, [tracks]);

// ❌ Bad - Don't store in state
setAlbumCount(albums.size);
```

### 5. Handle Loading States

Always show loading indicators:

```typescript
const { tracks, isLoading } = useLibraryStore();

if (isLoading) {
  return <LoadingSpinner />;
}
```

## State Persistence

### Playback State

Playback state is persisted to database via `playback-repository.ts`:
- Active track ID
- Current position
- Volume and mute state

**Note:** Currently, playback state persistence is implemented but may not be actively used. The state is primarily managed in-memory during a session.

### Library State

Library state is not persisted in Zustand - it's always fetched from the database. The store is a cache of the database state.

## Performance Considerations

1. **Selective Subscriptions**: Zustand automatically optimizes re-renders - components only re-render when their subscribed state changes
2. **Batch Updates**: Update multiple properties in a single action when possible
3. **Memoization**: Use `useMemo` for expensive computations based on store state

## Future Enhancements

Potential improvements:
- [ ] Persist playback state to database on position changes
- [ ] Implement optimistic updates for better UX
- [ ] Add undo/redo functionality
- [ ] Cache computed values (e.g., album/artist counts)
- [ ] Implement state persistence with AsyncStorage for offline support

