# Starlight Music Player 🎵

A modern, feature-rich music player built with React Native and Expo, inspired by Apple Music and Spotify's elegant design principles. Starlight provides a seamless music listening experience across iOS, Android, and Web platforms.

## ⚡ Quick Start (Team TL;DR)

```bash
# 0) Prereqs: Node 20+ and npm 10+

# 1) Install exactly from the lockfile (reproducible)
npm ci

# 2) Align native deps with current Expo SDK
npx expo install

# 3) Start the dev server
npm start

# Open the app
#   i  → iOS Simulator
#   a  → Android Emulator
#   w  → Web (http://localhost:8081)
```

Notes:
- No env vars required; app is state‑independent at startup
- Local SQLite DB is created at runtime and not committed
- If a simulator won’t open, start it from Xcode/Android Studio first, then `npm start`
- Install hiccups? `rm -rf node_modules package-lock.json && npm ci && npx expo install`

## ✨ Features

### 🎧 Core Music Playback
- **Universal Audio Support**: Play various audio formats including MP3, M4A, WAV, and more
- **Persistent Playback State**: Resume exactly where you left off across app sessions
- **Smart File Scanning**: Intelligent music library scanning with metadata extraction
- **Cross-Platform Compatibility**: Runs seamlessly on iOS, Android, and Web
- **Background Playback**: Continue listening while using other apps

### 📱 Apple Music-Inspired Interface
- **Modern Design System**: Clean, minimalistic UI with proper spacing and typography
- **Dynamic Theming**: Automatic light/dark mode support with system preference detection
- **Smooth Animations**: Fluid transitions and micro-interactions throughout the app
- **Gesture-Based Navigation**: Swipe gestures for track management and navigation
- **Responsive Layout**: Optimized for phones, tablets, and desktop browsers

### 🎵 Advanced Music Library Management
- **Smart Organization**: Automatic categorization by artists, albums, and genres
- **Metadata Integration**: Comprehensive track information display and management
- **Search Functionality**: Find your music instantly with intelligent search
- **Duplicate Detection**: Prevents duplicate tracks during import
- **Batch Operations**: Efficient handling of large music libraries

### 📋 Comprehensive Playlist System
- **Create & Manage Playlists**: Full CRUD operations for playlist management
- **Smart Playlist Cards**: Visual playlist representation with track counts
- **Add to Playlist**: Easy track addition with modal-based selection
- **Playlist Details**: Dedicated screens showing full playlist contents
- **Playback Controls**: Play, shuffle, and manage playlist playback
- **Track Removal**: Remove tracks from playlists with swipe gestures

### 👨‍🎤 Artist & Album Views
- **Artist Organization**: Browse music by artist with comprehensive views
- **Album Collections**: Visual album grid with artwork placeholders
- **Hierarchical Navigation**: Drill down from artists → albums → tracks
- **Release Chronology**: Albums organized by release year
- **Artist Statistics**: Track and album counts per artist

### 🎛️ Rich Playback Experience
- **Now Playing Screen**: Full-screen player with large artwork display
- **Mini Player**: Persistent bottom player for quick control access
- **Transport Controls**: Play, pause, skip, and seek functionality
- **Queue Management**: View and control the current playback queue
- **Shuffle & Repeat**: Advanced playback modes for different listening styles

### 💾 Robust Data Management
- **SQLite Database**: Reliable local storage for all music metadata
- **Cross-Platform Database**: Unified database layer for all platforms
- **Migration System**: Safe database schema updates and versioning
- **Data Persistence**: Blob URL to Data URI conversion for web compatibility
- **Efficient Queries**: Optimized database operations for smooth performance

### 🔧 Technical Architecture

#### Frontend Stack
```
React Native + Expo Router
├── TypeScript for type safety
├── Zustand for state management
├── Drizzle ORM for database operations
├── Expo AV for audio playback
├── React Navigation for routing
└── Expo Blur for visual effects
```

#### Database Schema
```sql
-- Core music entities
Artists → Albums → Tracks
├── artists (id, name, sort_key)
├── albums (id, title, artist_id, year, artwork_uri)
├── tracks (id, title, album_id, duration_ms, file_uri)
└── playback_state (active_track_id, position_ms, volume)

-- Playlist system
Playlists ↔ Tracks (Many-to-Many)
├── playlists (id, name, description, cover_image_uri)
└── playlist_tracks (playlist_id, track_id, position)
```

#### State Management
```typescript
// Global state stores
useLibraryStore()    // Track collection and library data
usePlayerStore()     // Current playback state and controls
usePlaylistStore()   // Playlist collection and management

// Theme system
useTheme()          // Dynamic theming with light/dark modes
```

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm 10+
- Expo CLI (`npm install -g @expo/cli`)
- Xcode (macOS) for iOS simulator
- Android Studio for Android emulator (optional)

### One-time Setup

```bash
# 1) Install dependencies from lockfile (reproducible)
npm ci

# 2) Ensure native dependencies are aligned to Expo SDK
npx expo install

# 3) Start development server
npm start
```

### Platform Access
Open the app on your preferred platform:
- **iOS Simulator**: Press `i` in terminal
- **Android Emulator**: Press `a` in terminal
- **Web Browser**: Press `w` in terminal or visit http://localhost:8081

### First Time Usage

1. **Import Your Music Library**
   - Tap the "+" button in the header
   - Select your music folder(s)
   - Wait for the scanning process to complete
   - Your music will be automatically organized

2. **Create Your First Playlist**
   - Scroll to the "Playlists" section
   - Tap "New Playlist" or the "+" icon
   - Give it a name and optional description
   - Start adding tracks using the "+" button on each track

3. **Explore Browse Features**
   - Use the "Artists" card to browse by artist
   - Use the "Albums" card to browse by album
   - Each view provides different organizational perspectives

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (buttons, text, etc.)
│   ├── artists-screen.tsx
│   ├── albums-screen.tsx
│   ├── playlist-*.tsx   # Playlist-related components
│   ├── now-playing.tsx  # Full-screen player
│   └── mini-player.tsx  # Bottom mini player
│
├── services/            # Business logic and external integrations
│   ├── file-scanner.ts  # Music file scanning and metadata
│   ├── library-service.ts    # Library management operations
│   ├── playlist-service.ts   # Playlist CRUD operations
│   └── playback-service.ts   # Audio playback control
│
├── db/                  # Database layer
│   ├── client.ts        # Database connection and configuration
│   ├── schema.ts        # Drizzle ORM schema definitions
│   ├── migrations/      # Database migration scripts
│   └── *-repository.ts  # Data access layer for each entity
│
├── state/               # Global state management
│   ├── library-store.ts # Music library state
│   ├── player-store.ts  # Playback state
│   └── playlist-store.ts # Playlist state
│
└── theme/              # Design system and theming
    ├── provider.tsx    # Theme context provider
    └── tokens.ts       # Design tokens (colors, spacing, etc.)

app/
├── _layout.tsx         # Root layout with providers
├── (tabs)/            # Tab-based navigation
│   ├── _layout.tsx    # Tab navigation setup
│   ├── index.tsx      # Main library screen
│   └── explore.tsx    # Secondary tab screen
└── modal.tsx          # Modal screen example
```

## 🎯 Key Features Deep Dive

### Music Library Management
The library system automatically scans selected folders and extracts metadata from audio files. It handles:
- **File Format Detection**: Supports major audio formats
- **Metadata Extraction**: Artist, album, title, duration, track numbers
- **Duplicate Prevention**: Avoids importing the same track multiple times
- **Progress Tracking**: Real-time scanning progress with user feedback

### Playlist Management
Full-featured playlist system with:
- **Visual Creation**: Modal-based playlist creation with form validation
- **Track Association**: Many-to-many relationship between playlists and tracks
- **Position Management**: Tracks maintain order within playlists
- **Bulk Operations**: Add multiple tracks efficiently

### Cross-Platform Audio
Leverages Expo AV for consistent audio playback:
- **Platform Abstraction**: Same API works across iOS, Android, and Web
- **Background Modes**: Continues playing when app is backgrounded
- **Interrupt Handling**: Properly handles phone calls and other interruptions
- **Queue Management**: Advanced queue manipulation and control

### Database Architecture
Uses SQLite with Drizzle ORM for type-safe database operations:
- **Relational Design**: Proper foreign key relationships
- **Query Optimization**: Efficient queries with proper indexing
- **Migration System**: Safe schema evolution over time
- **Platform Consistency**: Same database structure across all platforms

## 🔧 Development

### Available Scripts
- `npm start` – Start Expo development server
- `npm run reset-project` – Reset example scaffolding (project helper)
- `npm run web` – Start web development server
- `npm run ios` – Start iOS development build
- `npm run android` – Start Android development build

### Adding New Features

1. **Database Changes**: Update schema in `src/db/schema.ts` and create migrations
2. **State Management**: Add new stores in `src/state/` if needed
3. **Services**: Create business logic in `src/services/`
4. **Components**: Build UI components in `src/components/`
5. **Navigation**: Update routing in `app/` directory

### Code Style & Standards
- **TypeScript**: Full type coverage for better development experience
- **Component Architecture**: Functional components with hooks
- **State Management**: Zustand for simple, performant state management
- **Styling**: StyleSheet-based styling with theme integration
- **Testing**: Unit tests for critical business logic (planned)

## 🚦 Troubleshooting

### Installation Issues
```bash
# Clean install and retry
rm -rf node_modules package-lock.json
npm ci && npx expo install

# If simulators don't boot
# Launch them from Xcode/Android Studio first, then npm start
```

### Common Issues

**App crashes on startup**
- Clear Metro cache: `npx expo start --clear`
- Reset node modules: `rm -rf node_modules && npm install`
- Check Expo CLI version: `npx expo --version`

**Music files not importing**
- Verify file format compatibility (MP3, M4A, WAV supported)
- Check file permissions on selected folders
- Ensure files have proper metadata

**Playback issues**
- Check device audio settings and volume
- Verify network connection for web platform
- Restart the app to reset audio context

**Database errors**
- Clear app data to reset database
- Check for file system permissions
- Verify SQLite support on target platform

### Web-Specific Notes
- **SharedArrayBuffer**: Handled by dev server config – no manual action needed
- **SQLite async writes**: Uses async API directly to avoid worker serialization limits
- **File URIs**: Selected assets use blob: URIs, converted to data URIs for persistence

## 📊 Platform-Specific Features

### iOS
- Native audio session management
- Background playback with control center integration
- Proper interrupt handling for calls/notifications
- Hardware button control (play/pause, skip)

### Android
- MediaSession integration for lock screen controls
- Proper audio focus management
- Background service for uninterrupted playback
- Notification-based playback controls

### Web
- Service worker for offline functionality (planned)
- Keyboard shortcuts for common actions
- Drag-and-drop file import (planned)
- Browser media session API integration

## 🤝 Contributing

### Development Workflow
1. Create a feature branch
2. Make your changes following our coding standards
3. Commit with package-lock.json included
4. Push and open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow the existing component patterns
- Add JSDoc comments for complex functions
- Use meaningful variable and function names
- Keep components focused and single-purpose

## 📄 Data Persistence

### What Gets Persisted
- Local SQLite database is created at runtime
- User playlists and music library metadata
- Playback state and preferences
- Theme settings and user preferences

### What Doesn't Get Committed
```gitignore
# Dependencies
node_modules/

# Expo artifacts
.expo/
.expo-shared/
web-build/
dist/
build/

# Local databases/caches
*.db
*.sqlite
drizzle.sqlite
drizzle/

# OS/editors
.DS_Store
.idea/
.vscode/
```

## 🔮 Future Enhancements

### Planned Features
- [ ] **Cloud Sync**: Sync playlists and preferences across devices
- [ ] **Smart Playlists**: Auto-generated playlists based on listening habits
- [ ] **Social Features**: Share playlists and music recommendations
- [ ] **Audio Effects**: Equalizer and sound enhancement options
- [ ] **Lyrics Integration**: Display synchronized lyrics
- [ ] **Last.fm Integration**: Scrobbling and music discovery
- [ ] **Offline Mode**: Download tracks for offline listening
- [ ] **Advanced Search**: Filters, genres, and smart search

### Technical Roadmap
- [ ] **Unit Testing**: Comprehensive test coverage
- [ ] **E2E Testing**: Automated testing for critical user flows
- [ ] **Performance Monitoring**: Real-time performance metrics
- [ ] **Error Tracking**: Crash reporting and error analytics
- [ ] **Accessibility**: Full screen reader and keyboard navigation support

---

**Built with ❤️ using React Native and Expo**

*Bringing your music to life across every platform*
