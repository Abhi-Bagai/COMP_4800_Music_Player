# Starlight Music Player - Documentation

## Overview

Starlight is a cross-platform music player application built with Expo and React Native. It provides a comprehensive music library management system with playlist support, audio playback, and metadata extraction capabilities.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Key Features](#key-features)
5. [Platform Support](#platform-support)
6. [Getting Started](#getting-started)
7. [Documentation Index](#documentation-index)

## Architecture Overview

Starlight follows a layered architecture pattern:

```
┌─────────────────────────────────────┐
│         UI Layer (Components)        │
│  - Screens, Modals, UI Components   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      State Management (Zustand)     │
│  - Library Store, Player Store,     │
│    Playlist Store                   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Services Layer                 │
│  - Library Service, Playback Service│
│  - Playlist Service, File Scanner   │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Data Layer (Repository)        │
│  - Library Repository, Playlist     │
│    Repository, Playback Repository  │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Database Layer                 │
│  - SQLite (Native) / IndexedDB (Web)│
│  - Drizzle ORM                      │
└─────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Platform-Agnostic Data Layer**: The repository pattern abstracts platform-specific database implementations (SQLite for native, IndexedDB for web)
2. **Service Layer Abstraction**: Business logic is separated from UI and data access
3. **State Management**: Zustand provides lightweight, performant state management
4. **Component-Based UI**: Reusable components with theme support

## Project Structure

```
Starlight/
├── app/                          # Expo Router routes
│   ├── _layout.tsx              # Root layout
│   ├── (tabs)/                   # Tab navigation
│   │   ├── _layout.tsx          # Tab layout
│   │   ├── index.tsx            # Library screen
│   │   └── explore.tsx          # Now Playing screen
│   └── modal.tsx                 # Modal route
├── src/
│   ├── components/               # React components
│   │   ├── ui/                   # Base UI components
│   │   ├── albums-screen.tsx
│   │   ├── artists-screen.tsx
│   │   ├── audio-playback-provider.tsx
│   │   ├── folder-picker.tsx
│   │   ├── mini-player.tsx
│   │   ├── now-playing.tsx
│   │   ├── playlist-detail-screen.tsx
│   │   ├── sidebar-navigation.tsx
│   │   ├── table-view.tsx
│   │   └── tag-manager.tsx
│   ├── db/                       # Database layer
│   │   ├── client.ts             # SQLite client
│   │   ├── indexeddb.ts          # IndexedDB implementation
│   │   ├── library-repository.ts
│   │   ├── playlist-repository.ts
│   │   ├── playback-repository.ts
│   │   ├── schema.ts             # Database schema
│   │   └── playlist-schema.ts
│   ├── hooks/                    # Custom React hooks
│   │   └── use-track-scrubbing.ts
│   ├── services/                 # Business logic
│   │   ├── file-scanner.ts
│   │   ├── library-service.ts
│   │   ├── playback-service.ts
│   │   └── playlist-service.ts
│   ├── state/                    # Zustand stores
│   │   ├── index.ts
│   │   ├── library-store.ts
│   │   ├── player-store.ts
│   │   └── playlist-store.ts
│   └── theme/                     # Theme system
│       ├── provider.tsx
│       └── tokens.ts
├── components/                    # Shared components
├── constants/                     # App constants
└── docs/                          # Documentation (this folder)
```

## Technology Stack

### Core Framework
- **Expo** (~54.0.10) - React Native framework
- **React** (19.1.0) - UI library
- **React Native** (0.81.4) - Mobile framework
- **Expo Router** (~6.0.8) - File-based routing

### State Management
- **Zustand** (^5.0.1) - Lightweight state management

### Database
- **Drizzle ORM** (^0.44.5) - Type-safe SQL ORM
- **expo-sqlite** (~16.0.8) - SQLite for native platforms
- **IndexedDB** - Custom implementation for web platform

### Audio
- **expo-audio** (~1.0.13) - Audio playback

### File Handling
- **expo-document-picker** (~14.0.7) - File selection
- **expo-file-system** (~19.0.15) - File system access
- **music-metadata** (^11.9.0) - Audio metadata extraction

### UI/UX
- **@react-native-community/slider** (^5.0.1) - Slider component
- **react-native-gesture-handler** (^2.28.0) - Gesture handling
- **react-native-reanimated** (^4.1.0) - Animations
- **expo-blur** (^15.0.7) - Blur effects

## Key Features

### Music Library Management
- Import music files from device storage
- Recursive folder scanning (web only)
- Automatic metadata extraction from audio files
- Duplicate detection
- Track deletion and library clearing

### Audio Playback
- Play, pause, skip next/previous
- Seek/scrub through tracks
- Volume control
- Progress tracking
- Trackpad/mouse wheel scrubbing (web)

### Playlists
- Create custom playlists
- Add/remove tracks from playlists
- Playlist detail views
- Play and shuffle playlist functionality

### Organization
- View library by tracks, artists, albums
- Sortable track table view
- Search functionality (UI ready)
- Tag management (UI ready, functionality pending)

### UI/UX
- Dark mode support
- Responsive design
- Desktop-style layout with sidebar
- Mini player with playback controls
- Full-screen now playing view

## Platform Support

### Web
- Uses IndexedDB for storage
- Converts files to data URIs for playback
- Supports folder selection via webkitdirectory
- Trackpad/mouse wheel scrubbing

### iOS/Android (Native)
- Uses SQLite for storage
- Direct file URI playback
- Individual file selection
- Native file system access

## Getting Started

### Prerequisites
- Node.js >= 18
- npm or yarn
- Expo CLI (optional, can use npx)

### Installation

```bash
cd Starlight
npm install
```

### Development

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Building

```bash
# Build for production
expo build
```

## Documentation Index

- [Database Schema](./database-schema.md) - Complete database schema documentation
- [State Management](./state-management.md) - Zustand stores and state flow
- [Services](./services.md) - Service layer documentation
- [Components](./components.md) - UI component documentation
- [Routing](./routing.md) - Navigation and routing structure
- [Theme System](./theme-system.md) - Theming and design tokens
- [File Scanner](./file-scanner.md) - Music file scanning and metadata extraction

## Development Guidelines

1. **Type Safety**: The project uses TypeScript - maintain type safety throughout
2. **Platform Checks**: Use `Platform.OS` checks for platform-specific code
3. **Error Handling**: Always handle errors gracefully with user-friendly messages
4. **State Updates**: Use Zustand stores for global state, local state for component-specific data
5. **Database Access**: Always use repository functions, never access database directly from components
6. **Theme Usage**: Use theme tokens from `useTheme()` hook, never hardcode colors

## Contributing

When adding new features:
1. Update relevant documentation
2. Add TypeScript types
3. Handle both web and native platforms
4. Test on multiple platforms
5. Follow existing code patterns

## License

[Add license information here]

