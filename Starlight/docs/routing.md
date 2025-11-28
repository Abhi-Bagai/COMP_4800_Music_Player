# Routing Documentation

## Overview

Starlight uses **Expo Router** for file-based routing, providing a simple and intuitive navigation system. Routes are defined by the file structure in the `app/` directory.

## Route Structure

```
app/
├── _layout.tsx              # Root layout
├── (tabs)/                  # Tab navigation group
│   ├── _layout.tsx          # Tab layout
│   ├── index.tsx            # Library screen (default tab)
│   └── explore.tsx          # Now Playing screen
└── modal.tsx                # Modal route
```

## Root Layout

**File:** `app/_layout.tsx`

The root layout wraps the entire application and sets up global providers.

**Responsibilities:**
- Theme provider setup
- Audio playback provider initialization
- Navigation theme configuration
- Status bar configuration

**Structure:**
```typescript
export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <ThemeProvider initialMode="dark">
        <AudioPlaybackProvider />
        <NavigationThemeProvider>
          <Stack>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="modal" />
          </Stack>
          <StatusBar />
        </NavigationThemeProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
```

**Key Providers:**
- `ThemeProvider` - Theme context for the app
- `AudioPlaybackProvider` - Sets up audio player
- `NavigationThemeProvider` - React Navigation theme
- `GestureHandlerRootView` - Required for gesture handlers

## Tab Navigation

**File:** `app/(tabs)/_layout.tsx`

Defines the bottom tab navigation with two tabs.

**Tabs:**
1. **Library** (`index.tsx`) - Main library view
   - Icon: `music.note.list`
   - Title: "Library"

2. **Now Playing** (`explore.tsx`) - Now playing view
   - Icon: `play.fill`
   - Title: "Now Playing"

**Configuration:**
- Active tint color from theme
- Header hidden
- Haptic feedback on tab press
- Custom tab button component

## Library Screen

**File:** `app/(tabs)/index.tsx`

Main library screen with desktop-style layout.

**Layout:**
```
┌─────────────────────────────────────┐
│         Header Bar                   │
│  [STARLIGHT]  [Add Music] [Settings]│
└─────────────────────────────────────┘
┌──────────┬──────────────────────────┐
│          │                           │
│ Sidebar  │    Content Area           │
│          │                           │
│ - Library│    - Table View           │
│ - Artists│    - Albums View          │
│ - Albums │    - Artists View        │
│ - Genres │    - Empty State          │
│          │                           │
└──────────┴──────────────────────────┘
┌─────────────────────────────────────┐
│         Mini Player                  │
└─────────────────────────────────────┘
```

**Features:**
- Resizable sidebar (draggable divider)
- Multiple view modes (library, artists, albums)
- Track table with sorting
- Folder picker integration
- Playlist management
- Tag management
- Now playing modal

**State Management:**
- Local state for UI (modals, views, selected items)
- Global state from Zustand stores (tracks, playlists, player)

**Key Functions:**
- `handlePickMusicFolders()` - Opens folder picker
- `handleDeleteTrack()` - Deletes track with confirmation
- `handleAddToPlaylist()` - Opens add to playlist modal
- `handleClearLibrary()` - Clears entire library with confirmation

**View Modes:**
- `library` - Table view of all tracks
- `artists` - Artists screen
- `albums` - Albums screen
- `genres` - Placeholder (coming soon)

## Now Playing Screen

**File:** `app/(tabs)/explore.tsx`

Simple now playing screen (alternative to modal).

**Features:**
- Track artwork placeholder
- Track title and artist
- Progress timeline
- Playback controls (previous, play/pause, next)

**Note:** This screen is simpler than the `NowPlaying` modal component. The modal provides more features (volume control, full controls).

## Modal Route

**File:** `app/modal.tsx`

Generic modal route for future use.

**Configuration:**
- Presentation style: `modal`
- Can be navigated to via `router.push('/modal')`

**Current Status:** Placeholder route, not actively used.

## Navigation Patterns

### Programmatic Navigation

Expo Router provides navigation hooks:

```typescript
import { useRouter } from 'expo-router';

function MyComponent() {
  const router = useRouter();
  
  // Navigate to route
  router.push('/modal');
  
  // Go back
  router.back();
  
  // Replace current route
  router.replace('/modal');
}
```

### Route Parameters

Routes can accept parameters:

```typescript
// Navigate with params
router.push({
  pathname: '/playlist/[id]',
  params: { id: 'playlist-123' }
});

// Access params
import { useLocalSearchParams } from 'expo-router';
const { id } = useLocalSearchParams();
```

**Note:** Currently, Starlight doesn't use route parameters. Playlist details are managed via component state.

### Deep Linking

Expo Router supports deep linking:

```typescript
// app.json
{
  "expo": {
    "scheme": "starlight",
    // ...
  }
}

// Navigate via URL
starlight://playlist/123
```

## Navigation Flow

### Library Screen Flow

```
Library Screen
    ↓
[Add Music] → FolderPicker → Scan → Refresh Library
    ↓
[Track Row] → Play Track → Mini Player → Now Playing Modal
    ↓
[Add to Playlist] → AddToPlaylistModal → Select/Create Playlist
    ↓
[Sidebar] → Artists/Albums View → Detail Screen → Back
    ↓
[Playlist] → PlaylistDetailScreen → Play/Edit/Delete
```

### Playback Flow

```
Play Track
    ↓
AudioPlaybackProvider (creates player)
    ↓
Playback Service (manages playback)
    ↓
Player Store (updates state)
    ↓
Mini Player / Now Playing (displays state)
```

## Route Configuration

### Stack Configuration

The root layout uses a Stack navigator:

```typescript
<Stack>
  <Stack.Screen 
    name="(tabs)" 
    options={{ headerShown: false }} 
  />
  <Stack.Screen
    name="modal"
    options={{ 
      presentation: "modal", 
      title: "Modal" 
    }}
  />
</Stack>
```

### Tab Configuration

Tabs are configured in `(tabs)/_layout.tsx`:

```typescript
<Tabs
  screenOptions={{
    tabBarActiveTintColor: Colors[colorScheme].tint,
    headerShown: false,
    tabBarButton: HapticTab,
  }}
>
  <Tabs.Screen name="index" options={{ title: 'Library' }} />
  <Tabs.Screen name="explore" options={{ title: 'Now Playing' }} />
</Tabs>
```

## Best Practices

### 1. Use File-Based Routing

Keep routes organized by file structure:
- `app/index.tsx` → `/`
- `app/(tabs)/index.tsx` → `/(tabs)/`
- `app/modal.tsx` → `/modal`

### 2. Group Related Routes

Use route groups `(groupName)` for organization:
- `(tabs)` - Tab navigation
- Future: `(auth)`, `(settings)`, etc.

### 3. Keep Navigation Simple

Prefer component state over complex routing for:
- Modals (use component state)
- Detail screens (use component state)
- Temporary views

### 4. Use Type-Safe Navigation

Expo Router provides type-safe navigation:
```typescript
import { router } from 'expo-router';

// Type-safe route names
router.push('/modal'); // ✅
router.push('/invalid'); // ❌ Type error
```

## Future Enhancements

Potential routing improvements:

- [ ] Playlist detail route: `/playlist/[id]`
- [ ] Artist detail route: `/artist/[id]`
- [ ] Album detail route: `/album/[id]`
- [ ] Settings route: `/settings`
- [ ] Search route: `/search`
- [ ] Deep linking for playlists
- [ ] URL-based navigation for web

## Route Guards

Currently, Starlight doesn't implement route guards. Future considerations:

- Authentication guards (if auth is added)
- Onboarding flow
- Permission checks (file access, etc.)

## Web Routing

On web, Expo Router generates standard URLs:
- `/` - Library screen
- `/explore` - Now Playing screen
- `/modal` - Modal screen

These can be bookmarked and shared.

