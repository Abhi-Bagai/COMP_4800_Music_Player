# Spotify Integration Architecture

## High-Level Overview

The Spotify integration follows a **server-side OAuth flow** where:

1. **Client (React Native)** → Initiates OAuth by opening `/auth/spotify/login` in browser
2. **Spotify** → Redirects to `/auth/spotify/callback` with authorization code
3. **Backend (Koa)** → Exchanges code for tokens, stores them in PostgreSQL
4. **Client** → Receives deep link `starlight://auth/spotify/success` and refetches queries
5. **Client** → Calls backend API endpoints (`/api/spotify/*`) which proxy to Spotify API
6. **Backend** → Handles token refresh automatically, caches responses to reduce rate limits

## Data Flow

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
                              │
                    ┌─────────┴─────────┐
                    │                   │
              SpotifyAccount        ApiCache
              (tokens)              (responses)
```

## Key Components

### 1. Prisma Models

- **User**: Existing user model (assumed to exist)
- **SpotifyAccount**: Stores OAuth tokens per user
- **ApiCache**: Caches Spotify API responses with TTL

### 2. Koa Middleware & Helpers

- `requireAuth`: Ensures `ctx.state.user` exists
- `getValidSpotifyAccessToken`: Auto-refreshes expired tokens
- `fetchWithSpotifyCache`: Wraps Spotify API calls with caching

### 3. Routes

- `GET /auth/spotify/login`: Initiates OAuth with PKCE
- `GET /auth/spotify/callback`: Handles OAuth callback
- `GET /api/spotify/status`: Returns connection status
- `GET /api/spotify/playlists`: Lists user's playlists
- `GET /api/spotify/playlists/:id/tracks`: Gets playlist tracks
- `POST /api/spotify/playlists/:id/import`: Imports playlist into local DB

### 4. Token Management

- Access tokens expire in ~1 hour
- Refresh tokens are long-lived
- Automatic refresh happens transparently when accessing Spotify API
- Tokens stored encrypted/hashed in DB (recommended for production)

### 5. Caching Strategy

- Cache key format: `spotify:${userId}:${resource}:${resourceId}`
- TTL: 5-10 minutes (configurable)
- Cache invalidation on import/update operations

## Security Considerations

- **PKCE**: Required for OAuth flow (prevents code interception)
- **State parameter**: CSRF protection for OAuth callback
- **Server-side tokens**: Client never sees access tokens
- **HTTPS**: Required in production for OAuth redirects
- **Token encryption**: Recommended for production (not implemented in v1)

## Rate Limiting

Spotify API rate limits:

- 10,000 requests per hour per user
- Caching reduces actual API calls significantly
- Automatic retry with exponential backoff (future enhancement)
