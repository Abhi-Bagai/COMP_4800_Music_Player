# Starlight Music Player

A modern, cross-platform music player application built with React Native and Expo. Starlight provides a beautiful interface for managing your local music library and integrating with Spotify playlists.

## Features

### 🎵 Core Music Player Features

- **Local Music Library**: Scan and organize your local music files
- **Playback Controls**: Full-featured audio player with play, pause, skip, and seek
- **Now Playing Screen**: Beautiful full-screen player with album artwork and controls
- **Mini Player**: Persistent mini player for quick access
- **Volume Control**: Adjustable volume with mute functionality
- **Track Scrubbing**: Seek through tracks with gesture support

### 📚 Library Management

- **Artists View**: Browse music organized by artist
- **Albums View**: View albums with artwork and track listings
- **Playlists**: Create, manage, and organize custom playlists
- **Table View**: Detailed track listing with metadata
- **Tag Management**: Edit and manage track metadata
- **Folder Picker**: Select directories to scan for music files

### 🎧 Spotify Integration

- **OAuth Authentication**: Secure Spotify account connection
- **Playlist Import**: Import Spotify playlists into your local library
- **Playlist Browsing**: View and browse your Spotify playlists
- **Preview Playback**: Play 30-second previews of Spotify tracks
- **Deep Linking**: Seamless authentication flow with deep links

### 🎨 User Interface

- **Modern Design**: Built with React Native Reusables and Tailwind CSS
- **Dark/Light Theme**: Automatic theme support
- **Responsive Layout**: Optimized for iOS, Android, and Web
- **Gesture Support**: Swipe gestures and drag-and-drop functionality
- **Edge-to-Edge**: Modern edge-to-edge design on Android

## Tech Stack

### Frontend

- **React Native**: 0.81.4
- **Expo**: 54.0.13
- **Expo Router**: ~6.0.10 (File-based routing)
- **TypeScript**: ~5.9.2
- **Nativewind**: ^4.2.1 (Tailwind CSS for React Native)
- **Zustand**: ^5.0.8 (State management)
- **TanStack Query**: ^5.90.5 (Data fetching)
- **Drizzle ORM**: ^0.44.6 (Database ORM)
- **Expo SQLite**: ^16.0.8 (Local database)
- **Expo Audio**: ^1.0.13 (Audio playback)

### Backend

- **Koa.js**: ^2.15.0 (Web framework)
- **TypeScript**: ^5.5.0
- **Prisma**: ^5.20.0 (ORM for PostgreSQL/SQLite)
- **Node.js**: v18+ (LTS recommended)

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (LTS recommended)
- **npm/yarn/pnpm/bun**: Package manager
- **Expo CLI**: Install globally with `npm install -g expo-cli` or use `npx`
- **iOS Simulator** (macOS only) or **Android Emulator** for testing
- **Expo Go** app (optional, for physical device testing)

### Frontend Setup

1. **Install dependencies:**

   ```bash
   cd Starlight
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

3. **Run on your platform:**
   - **iOS**: Press `i` in the terminal (macOS only)
   - **Android**: Press `a` in the terminal
   - **Web**: Press `w` in the terminal
   - **Physical Device**: Scan the QR code with Expo Go app

### Backend Setup

1. **Navigate to backend directory:**

   ```bash
   cd Starlight/backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in `Starlight/backend/` with the following:

   ```env
   PORT=3001
   NODE_ENV=development
   SESSION_SECRET=your-secret-key-here

   # Spotify OAuth (required for Spotify integration)
   SPOTIFY_CLIENT_ID=your-spotify-client-id
   SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3001/auth/spotify/callback

   # Frontend Configuration
   FRONTEND_DEEP_LINK=starlight://auth/spotify/success
   FRONTEND_URL=http://localhost:8081

   # Optional: Cache TTL (in seconds)
   SPOTIFY_CACHE_TTL=300
   ```

4. **Set up the database:**

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run database migrations
   npm run prisma:migrate
   ```

5. **Start the backend server:**

   ```bash
   # Development mode (with hot reload)
   npm run dev

   # Production mode
   npm run build
   npm start
   ```

### Spotify Integration Setup

1. **Create a Spotify App:**
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Create a new app
   - Add redirect URI: `http://127.0.0.1:3001/auth/spotify/callback` (development)
   - For production, use: `https://your-backend-url.com/auth/spotify/callback`
   - Copy Client ID and Client Secret to your `.env` file

2. **Configure Frontend:**
   - Add `EXPO_PUBLIC_API_URL=http://localhost:3001` to your environment or `app.config.js`

3. **See detailed integration guide:**
   - Check `SPOTIFY_INTEGRATION_GUIDE.md` for complete setup instructions

## Project Structure

```
Starlight/
├── app/                    # Expo Router app directory
│   ├── (tabs)/            # Tab navigation screens
│   ├── index.tsx         # Home screen
│   └── _layout.tsx       # Root layout
├── src/
│   ├── components/       # React components
│   │   ├── albums-screen.tsx
│   │   ├── artists-screen.tsx
│   │   ├── now-playing.tsx
│   │   ├── playlists-screen.tsx
│   │   ├── spotify-playlist-import-screen.tsx
│   │   └── ui/           # UI component library
│   ├── db/               # Database layer
│   │   ├── client.ts     # Drizzle client
│   │   ├── schema.ts     # Database schema
│   │   └── migrations/   # Database migrations
│   ├── services/         # Business logic services
│   │   ├── library-service.ts
│   │   ├── playback-service.ts
│   │   ├── playlist-service.ts
│   │   └── spotify-api-client.ts
│   ├── state/            # Zustand stores
│   │   └── player-store.ts
│   ├── hooks/            # Custom React hooks
│   └── contexts/         # React contexts
├── backend/              # Backend server
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── services/     # Backend services
│   │   ├── middleware/   # Koa middleware
│   │   └── config.ts     # Configuration
│   └── prisma/           # Prisma schema and migrations
└── package.json
```

## Development

### Available Scripts

**Frontend:**

- `npm run dev` - Start Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web
- `npm run clean` - Clean build artifacts

**Backend:**

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

### Adding Components

You can add more reusable components using the CLI:

```bash
npx react-native-reusables/cli@latest add [...components]
```

## Documentation

- **Architecture**: See `architecture.md` in the root directory
- **Spotify Integration**: See `SPOTIFY_INTEGRATION_GUIDE.md` and `SPOTIFY_INTEGRATION_SUMMARY.md`
- **Backend Architecture**: See `backend/ARCHITECTURE.md`
- **Backend README**: See `backend/README.md`
- **Deployment Notes**: See `BCIT_ISSP_Project_Deployment_Notes.md` in the root directory

## Deployment

### Mobile App Deployment

The easiest way to deploy your app is with [Expo Application Services (EAS)](https://expo.dev/eas):

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit --platform ios
eas submit --platform android
```

### Backend Deployment

1. **Build the backend:**

   ```bash
   cd backend
   npm run build
   ```

2. **Set production environment variables**

3. **Run database migrations:**

   ```bash
   npm run prisma:migrate
   ```

4. **Start with process manager (PM2, systemd, or Docker):**

   ```bash
   npm start
   ```

5. **Configure reverse proxy (Nginx recommended) with SSL**

## Learn More

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Nativewind Docs](https://www.nativewind.dev/)
- [React Native Reusables](https://reactnativereusables.com)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Koa.js Docs](https://koajs.com/)

## License

This project is part of the BCIT COMP 4800 course.
