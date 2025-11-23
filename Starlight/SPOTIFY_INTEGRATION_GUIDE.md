# Spotify Integration Guide

This guide explains how to integrate the Spotify Web API into your Starlight app.

## Overview

The integration follows a **server-side OAuth flow** where:

- All Spotify API calls go through your Koa backend
- Tokens are stored server-side in PostgreSQL
- The React Native client uses TanStack Query to fetch data
- Spotify tracks are imported into your local SQLite database

## Setup

### 1. Backend Setup

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Set up PostgreSQL database:**

   ```bash
   # Create database
   createdb starlight

   # Run migrations
   npm run prisma:migrate
   ```

3. **Configure environment variables:**
   Copy `backend/.env.example` to `backend/.env` and fill in:
   - `DATABASE_URL`: PostgreSQL connection string
   - `SPOTIFY_CLIENT_ID`: From Spotify Developer Dashboard
   - `SPOTIFY_CLIENT_SECRET`: From Spotify Developer Dashboard
   - `SPOTIFY_REDIRECT_URI`: `http://localhost:3001/auth/spotify/callback`
   - `FRONTEND_DEEP_LINK`: `starlight://auth/spotify/success`

4. **Start backend server:**
   ```bash
   npm run dev
   ```

### 2. Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3001/auth/spotify/callback`
4. Copy Client ID and Client Secret to `.env`

### 3. Frontend Setup

1. **Add environment variable:**
   Create `.env` or `app.config.js`:

   ```javascript
   EXPO_PUBLIC_API_URL=http://localhost:3001
   ```

2. **Configure deep linking:**
   Your `app.json` already has `"scheme": "starlight"`, which enables deep links.

## Architecture

### Data Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client    │────────▶│   Backend   │────────▶│   Spotify   │
│ (React Nav) │         │   (Koa)     │         │     API     │
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ PostgreSQL  │
                        │  (Prisma)   │
                        └─────────────┘
```

### Key Components

1. **Backend (`backend/`):**
   - Prisma schema with `User`, `SpotifyAccount`, `ApiCache`
   - Koa routes for OAuth and API endpoints
   - Token refresh and caching utilities

2. **Client (`src/`):**
   - TanStack Query hooks (`src/hooks/use-spotify.ts`)
   - API client (`src/services/spotify-api-client.ts`)
   - Import service (`src/services/spotify-import-client.ts`)

## Usage

### 1. Connect Spotify Account

```tsx
import { useSpotifyLogin, useSpotifyStatus } from '@/hooks/use-spotify';

function SpotifyConnectButton() {
  const { data: status } = useSpotifyStatus();
  const loginMutation = useSpotifyLogin();

  if (status?.linked) {
    return <Text>Connected as {status.profile?.displayName}</Text>;
  }

  return <Button onPress={() => loginMutation.mutate()}>Connect to Spotify</Button>;
}
```

### 2. Display Spotify Playlists

```tsx
import { useSpotifyPlaylists } from '@/hooks/use-spotify';

function SpotifyPlaylistsScreen() {
  const { data, isLoading } = useSpotifyPlaylists();

  if (isLoading) return <ActivityIndicator />;

  return (
    <FlatList
      data={data?.playlists || []}
      renderItem={({ item }) => (
        <PlaylistItem name={item.name} trackCount={item.trackCount} image={item.image} />
      )}
    />
  );
}
```

### 3. Import Playlist

```tsx
import { useImportSpotifyPlaylist } from '@/hooks/use-spotify';

function ImportButton({ playlistId, playlistName }: Props) {
  const importMutation = useImportSpotifyPlaylist();

  return (
    <Button
      onPress={() => importMutation.mutate({ playlistId, playlistName })}
      disabled={importMutation.isPending}>
      {importMutation.isPending ? 'Importing...' : 'Import to Library'}
    </Button>
  );
}
```

### 4. Handle Deep Link Callback

In your root component or deep link handler:

```tsx
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useSpotifyAuthCallback } from '@/hooks/use-spotify';

function App() {
  const callbackMutation = useSpotifyAuthCallback();

  useEffect(() => {
    // Handle initial URL (if app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) callbackMutation.mutate(url);
    });

    // Handle URL changes (if app already running)
    const subscription = Linking.addEventListener('url', (event) => {
      callbackMutation.mutate(event.url);
    });

    return () => subscription.remove();
  }, []);

  // ... rest of app
}
```

### 5. Play Spotify Tracks

#### Option A: Preview URL (30-second preview)

```tsx
import { usePlayerStore } from '@/state/player-store';

function playSpotifyPreview(track: SpotifyTrack) {
  if (track.previewUrl) {
    // Use react-native-track-player with previewUrl
    usePlayerStore.getState().playTrack({
      id: track.spotifyTrackId,
      uri: track.previewUrl,
      title: track.name,
      artist: track.artists.join(', '),
      duration: track.durationMs,
    });
  } else {
    // Fallback to "Play in Spotify" deep link
    Linking.openURL(track.spotifyUri);
  }
}
```

#### Option B: Deep Link to Spotify App

```tsx
import * as Linking from 'expo-linking';

function playInSpotify(track: SpotifyTrack) {
  // Opens Spotify app with track
  Linking.openURL(track.spotifyUri);
  // Example: spotify:track:4iV5W9uYEdYUVa79Axb7Rh
}
```

## Database Schema Extensions

Your local `Track` schema may need these fields for full Spotify support:

```typescript
// In src/db/schema.ts
export const tracks = sqliteTable('tracks', {
  // ... existing fields
  source: text('source'), // 'local' | 'spotify'
  spotifyTrackId: text('spotify_track_id'),
  spotifyUri: text('spotify_uri'),
  previewUrl: text('preview_url'),
});
```

## Distinguishing Track Sources

In your UI, distinguish between local and Spotify tracks:

```tsx
function TrackItem({ track }: { track: Track }) {
  const isSpotify = track.source === 'spotify';

  return (
    <View>
      <Text>{track.title}</Text>
      {isSpotify && <Badge>Spotify</Badge>}
      {isSpotify && !track.previewUrl && <Text>Full playback in Spotify app</Text>}
    </View>
  );
}
```

## Backend Authentication

**Important:** You need to implement session-based authentication in your backend.

The routes expect `ctx.state.user` to be set. Add middleware in `backend/src/index.ts`:

```typescript
// Example session middleware
app.use(async (ctx, next) => {
  const userId = ctx.session?.userId;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      ctx.state.user = {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    }
  }
  await next();
});
```

## Error Handling

Handle common errors:

```tsx
function SpotifyPlaylistsScreen() {
  const { data, error, isLoading } = useSpotifyPlaylists();

  if (error) {
    if (error.message.includes('Unauthorized')) {
      return <Text>Please connect your Spotify account</Text>;
    }
    return <Text>Error: {error.message}</Text>;
  }

  // ... render playlists
}
```

## Rate Limiting

The backend implements caching to reduce Spotify API calls:

- Playlists cached for 10 minutes
- Playlist tracks cached for 10 minutes
- Cache automatically invalidated after imports

## Production Considerations

1. **HTTPS:** Use HTTPS for OAuth redirects in production
2. **Token Encryption:** Encrypt tokens in database (not implemented in v1)
3. **CORS:** Configure CORS properly for your frontend domain
4. **Session Security:** Use secure, httpOnly cookies
5. **Error Logging:** Add proper error logging and monitoring
6. **Rate Limiting:** Implement rate limiting on backend endpoints

## Troubleshooting

### OAuth callback fails

- Check redirect URI matches Spotify app settings
- Verify `FRONTEND_DEEP_LINK` matches your app scheme
- Check backend logs for errors

### Tokens expire frequently

- Verify token refresh logic is working
- Check `expiresAt` is calculated correctly
- Ensure refresh token is stored properly

### Playlists not loading

- Check backend is running and accessible
- Verify user is authenticated (session exists)
- Check Spotify API rate limits

### Import fails

- Verify local database schema supports Spotify fields
- Check artist/album creation logic
- Review error logs for specific failures

## Next Steps

1. Extend `Track` schema with Spotify fields
2. Implement session authentication
3. Add UI components for Spotify features
4. Test OAuth flow end-to-end
5. Add error boundaries and loading states
6. Implement playlist sync/update functionality
