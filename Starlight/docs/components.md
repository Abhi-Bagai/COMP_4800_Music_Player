# Components Documentation

## Overview

Starlight uses a component-based architecture with reusable UI components. Components are located in `src/components/` and follow React Native best practices with TypeScript.

## Component Structure

```
src/components/
├── ui/                    # Base UI components
│   ├── button.tsx
│   ├── icon-button.tsx
│   ├── list-item.tsx
│   ├── surface.tsx
│   └── text.tsx
├── albums-screen.tsx
├── artists-screen.tsx
├── audio-playback-provider.tsx
├── folder-picker.tsx
├── mini-player.tsx
├── now-playing.tsx
├── playlist-detail-screen.tsx
├── playlist-creation-modal.tsx
├── add-to-playlist-modal.tsx
├── sidebar-navigation.tsx
├── table-view.tsx
└── tag-manager.tsx
```

## Base UI Components

### Button

**File:** `src/components/ui/button.tsx`

Reusable button component with variants.

**Props:**
- `variant`: `'primary' | 'secondary' | 'ghost'`
- `size`: `'sm' | 'md' | 'lg'`
- `onPress`: Press handler
- `disabled`: Boolean
- `children`: Button content

**Usage:**
```typescript
<Button variant="primary" onPress={handlePress}>
  Click Me
</Button>
```

### IconButton

**File:** `src/components/ui/icon-button.tsx`

Button that displays an icon.

**Props:**
- `icon`: React node (typically IconSymbol)
- `onPress`: Press handler
- `accessibilityLabel`: Accessibility label
- `tone`: `'primary' | 'secondary'`

### Text

**File:** `src/components/ui/text.tsx`

Themed text component.

**Props:**
- `variant`: `'body' | 'subtitle' | 'caption'`
- `weight`: `'regular' | 'medium' | 'bold'`
- `tone`: `'default' | 'subtle'`
- `style`: Additional styles

### Surface

**File:** `src/components/ui/surface.tsx`

Container component with elevation variants.

**Props:**
- `variant`: `'flat' | 'elevated'`
- `padding`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- `style`: Additional styles
- `children`: Content

## Screen Components

### AlbumsScreen

**File:** `src/components/albums-screen.tsx`

Displays albums in a grid view with detail screens.

**Features:**
- Grid layout (2 columns)
- Album detail view with track list
- Play and shuffle album functionality
- Sorted by album title

**Props:**
```typescript
interface AlbumsScreenProps {
  onBack: () => void;
}
```

**State:**
- `albums`: Array of albums with tracks
- `selectedAlbum`: Currently viewed album

**Usage:**
```typescript
<AlbumsScreen onBack={() => setView('library')} />
```

**Key Functions:**
- `organizeByAlbums()` - Groups tracks by album
- `handlePlayAlbum()` - Plays first track in album
- `handleShuffleAlbum()` - Shuffles and plays album

### ArtistsScreen

**File:** `src/components/artists-screen.tsx`

Displays artists in a list with album sections.

**Features:**
- List of artists with album counts
- Artist detail view with albums grouped by album
- Section list showing albums and tracks
- Play album functionality

**Props:**
```typescript
interface ArtistsScreenProps {
  onBack: () => void;
}
```

**State:**
- `artists`: Array of artists with albums and tracks
- `selectedArtist`: Currently viewed artist

**Usage:**
```typescript
<ArtistsScreen onBack={() => setView('library')} />
```

**Key Functions:**
- `organizeByArtists()` - Groups tracks by artist and album
- `handlePlayArtist()` - Plays first track from artist
- `handlePlayAlbum()` - Plays first track from album

### PlaylistDetailScreen

**File:** `src/components/playlist-detail-screen.tsx`

Displays playlist details with track list.

**Features:**
- Playlist header with artwork, name, description
- Track list with swipe-to-remove
- Play and shuffle playlist
- Delete playlist option
- Mini player integration

**Props:**
```typescript
interface PlaylistDetailScreenProps {
  playlistId: string;
  onBack: () => void;
  onPlaylistDeleted?: () => void;
}
```

**State:**
- `playlist`: Full playlist data with tracks
- `isLoading`: Loading state
- `showNowPlaying`: Modal visibility

**Usage:**
```typescript
<PlaylistDetailScreen
  playlistId="playlist-123"
  onBack={() => setSelectedPlaylist(null)}
  onPlaylistDeleted={handleRefresh}
/>
```

**Key Functions:**
- `loadPlaylistDetails()` - Fetches playlist from database
- `handleRemoveTrack()` - Removes track from playlist
- `handleDeletePlaylist()` - Deletes entire playlist
- `handlePlayPlaylist()` - Plays first track
- `handleShufflePlay()` - Shuffles and plays

## Playback Components

### AudioPlaybackProvider

**File:** `src/components/audio-playback-provider.tsx`

Provider component that sets up the audio player.

**Purpose:**
- Initializes expo-audio player
- Sets up player callback for playback service
- Manages player lifecycle

**Usage:**
```typescript
// In root layout
<AudioPlaybackProvider />
```

**Implementation:**
- Uses `useAudioPlayer` hook from expo-audio
- Sets callback via `setPlayerCallback()` from playback service
- Cleans up on unmount

### MiniPlayer

**File:** `src/components/mini-player.tsx`

Bottom bar player with basic controls.

**Features:**
- Track info (title, artist, album)
- Progress bar with scrubbing
- Play/pause, skip controls
- Shuffle and repeat buttons (UI only)
- Volume slider
- Tag track button

**Props:**
```typescript
interface MiniPlayerProps {
  onPress: () => void;  // Opens full now playing
  onTagTrack?: () => void;
}
```

**State:**
- Uses `usePlayerStore()` for playback state
- Uses `useTrackScrubbing()` for scrubbing

**Usage:**
```typescript
{activeTrack && (
  <MiniPlayer
    onPress={() => setShowNowPlaying(true)}
    onTagTrack={handleTagTrack}
  />
)}
```

**Key Features:**
- Only renders when `activeTrack` exists
- Position updates every 500ms
- Supports trackpad/mouse wheel scrubbing (web)
- Shows remaining time

### NowPlaying

**File:** `src/components/now-playing.tsx`

Full-screen now playing modal.

**Features:**
- Large artwork display
- Track and artist info
- Progress slider with scrubbing
- Full playback controls
- Volume control
- Bottom action buttons (Lyrics, AirPlay, Queue)

**Props:**
```typescript
interface NowPlayingProps {
  visible: boolean;
  onClose: () => void;
}
```

**State:**
- Uses `usePlayerStore()` for playback state
- Uses `useTrackScrubbing()` for scrubbing
- Animated slide-up modal

**Usage:**
```typescript
<NowPlaying
  visible={showNowPlaying}
  onClose={() => setShowNowPlaying(false)}
/>
```

**Key Features:**
- Slide-up animation (Animated API)
- Responsive artwork size
- Full playback controls
- Volume slider
- Platform-specific styling (iOS blur, Android solid)

## Library Components

### FolderPicker

**File:** `src/components/folder-picker.tsx`

File and folder selection for importing music.

**Features:**
- Folder selection (web only)
- Individual file selection
- Progress display during scanning
- Scan completion summary

**Props:**
```typescript
interface FolderPickerProps {
  onScanComplete?: () => void;
  onScanError?: (error: Error) => void;
  onBack?: () => void;
}
```

**State:**
- `isScanning`: Scanning state
- `scanProgress`: Progress information

**Usage:**
```typescript
<FolderPicker
  onScanComplete={handleScanComplete}
  onScanError={handleError}
  onBack={() => setShowPicker(false)}
/>
```

**Platform Behavior:**
- **Web**: Supports folder selection via `webkitdirectory`
- **Native**: Individual file selection only

**Key Functions:**
- `handlePickFolder()` - Opens folder picker (web)
- `handlePickFiles()` - Opens file picker
- `scanSelectedFiles()` - Processes selected files

### TableView

**File:** `src/components/table-view.tsx`

Sortable table view for tracks.

**Features:**
- Sortable columns (title, artist, album, time, BPM, genre)
- Track row with metadata
- Source icon
- Tags display (first 3 tags)
- Click to play
- Delete and add to playlist actions

**Props:**
```typescript
interface TableViewProps {
  tracks: Track[];
  onTrackPress: (track: Track) => void;
  onTrackDelete?: (track: Track) => void;
  onTrackAddToPlaylist?: (track: Track) => void;
}
```

**State:**
- `sortColumn`: Currently sorted column
- `sortDirection`: `'asc' | 'desc'`

**Usage:**
```typescript
<TableView
  tracks={tracks}
  onTrackPress={playTrack}
  onTrackDelete={handleDelete}
  onTrackAddToPlaylist={handleAddToPlaylist}
/>
```

**Columns:**
- `#` - Track number
- `Source` - Source icon
- `Title` - Track title
- `Time` - Duration
- `Artist` - Artist name
- `Album` - Album title
- `BPM` - Beats per minute (mock data)
- `Genre` - Genre (mock data)
- `Tags` - Track tags (first 3)

### SidebarNavigation

**File:** `src/components/sidebar-navigation.tsx`

Sidebar navigation for library views.

**Features:**
- Search bar (UI only, functionality pending)
- Navigation items (Library, Artists, Albums, Genres)
- Active state highlighting
- Expandable sections (future)

**Props:**
```typescript
interface SidebarNavigationProps {
  onViewChange: (view: string) => void;
  currentView: string;
}
```

**State:**
- `expandedItems`: Array of expanded item IDs
- `searchText`: Search query (not yet functional)

**Usage:**
```typescript
<SidebarNavigation
  onViewChange={setSidebarView}
  currentView={sidebarView}
/>
```

**Navigation Items:**
- Library
- Artists
- Albums
- Genres (placeholder)

## Modal Components

### PlaylistCreationModal

**File:** `src/components/playlist-creation-modal.tsx`

Modal for creating new playlists.

**Features:**
- Name input (required)
- Description input (optional)
- Artwork placeholder
- Create/Cancel buttons
- Platform-specific styling (iOS blur, Android solid)

**Props:**
```typescript
interface PlaylistCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onPlaylistCreated?: (playlistId: string) => void;
}
```

**State:**
- `name`: Playlist name
- `description`: Playlist description
- `isCreating`: Loading state

**Usage:**
```typescript
<PlaylistCreationModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onPlaylistCreated={handleRefresh}
/>
```

### AddToPlaylistModal

**File:** `src/components/add-to-playlist-modal.tsx`

Modal for adding tracks to playlists.

**Features:**
- Track info display
- List of existing playlists
- "Create New Playlist" option
- Add to playlist functionality

**Props:**
```typescript
interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  track?: { id: string; title: string; artist?: { name: string } | null } | null;
  onPlaylistCreated?: () => void;
}
```

**State:**
- Uses `usePlaylistStore()` for playlist list

**Usage:**
```typescript
<AddToPlaylistModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  track={selectedTrack}
  onPlaylistCreated={() => setShowCreateModal(true)}
/>
```

### TagManager

**File:** `src/components/tag-manager.tsx`

Modal for managing track tags.

**Features:**
- Grid of available tags
- Toggle tags on/off
- Save/Cancel actions
- Visual feedback for selected tags

**Props:**
```typescript
interface TagManagerProps {
  visible: boolean;
  onClose: () => void;
  trackId?: string;
  currentTags?: string[];
  onTagsUpdate?: (tags: string[]) => void;
}
```

**State:**
- `selectedTags`: Array of selected tag names

**Available Tags:**
- Banger, Dancefloor Destroyers, Epic Climax, Heavy Artillery
- Bumpin', Chill, Dark, Dope
- Headline, Peak-time, Warm-up
- Breakdown, Build-up, Drop
- Vocal, Instrumental

**Usage:**
```typescript
<TagManager
  visible={showTagManager}
  onClose={() => setShowTagManager(false)}
  trackId={track.id}
  currentTags={track.tags}
  onTagsUpdate={handleTagsUpdate}
/>
```

**Note:** Tag persistence to database is not yet implemented. The UI is ready but `onTagsUpdate` callback needs database integration.

## Component Patterns

### Theme Usage

All components use the theme system:

```typescript
const { tokens } = useTheme();

<View style={{ backgroundColor: tokens.colors.background }}>
  <Text style={{ color: tokens.colors.text }}>Hello</Text>
</View>
```

### State Management

Components access global state via Zustand hooks:

```typescript
const { tracks } = useLibraryStore();
const { activeTrack, isPlaying } = usePlayerStore();
const { playlists } = usePlaylistStore();
```

### Platform-Specific Code

Use Platform checks for platform-specific behavior:

```typescript
if (Platform.OS === 'web') {
  // Web-specific code
} else {
  // Native-specific code
}
```

### Error Handling

Components handle errors gracefully:

```typescript
try {
  await someOperation();
} catch (error) {
  console.error('Error:', error);
  if (Platform.OS === 'web') {
    alert('Operation failed');
  } else {
    Alert.alert('Error', 'Operation failed');
  }
}
```

## Best Practices

1. **Use Theme Tokens**: Never hardcode colors, use `tokens.colors.*`
2. **Type Safety**: Define TypeScript interfaces for all props
3. **Accessibility**: Include `accessibilityLabel` for interactive elements
4. **Loading States**: Show loading indicators during async operations
5. **Error States**: Handle and display errors to users
6. **Empty States**: Show helpful messages when data is empty
7. **Platform Awareness**: Adapt UI/UX for different platforms

## Future Enhancements

- [ ] Implement search functionality in SidebarNavigation
- [ ] Add tag persistence to database in TagManager
- [ ] Implement shuffle and repeat functionality
- [ ] Add lyrics display in NowPlaying
- [ ] Implement queue management
- [ ] Add drag-and-drop for playlist reordering
- [ ] Add album artwork display
- [ ] Implement genre view

