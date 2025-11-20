# Starlight Backend

Koa backend server for Starlight music player with Spotify integration.

## Features

- Spotify OAuth (Authorization Code with PKCE)
- Automatic token refresh
- API response caching
- Playlist and track fetching
- Playlist import support

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Set up database:**

   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

See `.env.example` for required variables:

- `DATABASE_URL`: PostgreSQL connection string
- `SPOTIFY_CLIENT_ID`: Spotify app client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify app client secret
- `SPOTIFY_REDIRECT_URI`: OAuth callback URL
- `FRONTEND_DEEP_LINK`: Deep link scheme for OAuth success
- `SESSION_SECRET`: Secret for session signing

## API Routes

### Authentication

- `GET /auth/spotify/login` - Initiate Spotify OAuth
- `GET /auth/spotify/callback` - Handle OAuth callback

### Spotify API

- `GET /api/spotify/status` - Check connection status
- `GET /api/spotify/playlists` - List user's playlists
- `GET /api/spotify/playlists/:id/tracks` - Get playlist tracks
- `POST /api/spotify/playlists/:id/import` - Import playlist data

## Architecture

See `ARCHITECTURE.md` for detailed architecture documentation.

## Development

- **TypeScript:** Strict mode enabled
- **Database:** PostgreSQL with Prisma ORM
- **Server:** Koa.js with TypeScript
- **Session:** koa-session (configure for your auth system)

## Important Notes

1. **Authentication:** You need to implement session middleware that sets `ctx.state.user` from your session/JWT system.

2. **Token Storage:** In production, encrypt tokens before storing in database.

3. **CORS:** Configure CORS properly for your frontend domain in production.

4. **HTTPS:** Required for OAuth in production.
