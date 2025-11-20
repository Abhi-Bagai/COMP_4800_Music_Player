# Testing the Spotify Integration

## Quick Test (No Authentication Required)

These endpoints don't require authentication and can be used to verify basic setup:

### 1. Health Check

```bash
curl http://localhost:3001/test/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "development"
}
```

### 2. Database Connection Test

```bash
curl http://localhost:3001/test/db
```

Expected response:

```json
{
  "status": "ok",
  "message": "Database connection successful"
}
```

### 3. Configuration Check

```bash
curl http://localhost:3001/test/config
```

Expected response:

```json
{
  "port": 3001,
  "nodeEnv": "development",
  "spotify": {
    "clientId": "***configured***",
    "redirectUri": "http://localhost:3001/auth/spotify/callback",
    "authUrl": "https://accounts.spotify.com/authorize",
    "scopes": "user-read-private user-read-email playlist-read-private playlist-read-collaborative"
  },
  "frontend": {
    "deepLink": "starlight://auth/spotify/success"
  },
  "cache": {
    "ttl": 300
  }
}
```

## Using the Test Script

Run the automated test script:

```bash
cd backend
node test-api.js
```

Or with a custom API URL:

```bash
API_URL=http://localhost:3001 node test-api.js
```

## Testing Authenticated Endpoints

To test authenticated endpoints (like `/api/spotify/status`), you need to:

1. **Set up session authentication** in `backend/src/index.ts`
2. **Create a test user** in your database
3. **Log in** to get a session cookie
4. **Make requests with the session cookie**

### Example with curl (after setting up auth):

```bash
# Login first (adjust based on your auth endpoint)
curl -c cookies.txt -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}'

# Then test Spotify status
curl -b cookies.txt http://localhost:3001/api/spotify/status
```

## Testing OAuth Flow

1. **Start backend:** `npm run dev`
2. **Open browser:** Navigate to `http://localhost:3001/auth/spotify/login`
   - This will redirect to Spotify (if auth is set up)
   - After authorization, Spotify redirects to `/auth/spotify/callback`
   - Callback redirects to `starlight://auth/spotify/success`

## Common Issues

### "Cannot connect to server"

- Make sure backend is running: `npm run dev`
- Check if port 3001 is available
- Verify `PORT` in `.env` matches

### "Database connection failed"

- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run migrations: `npm run prisma:migrate`

### "Unauthorized" on Spotify endpoints

- Implement session middleware in `backend/src/index.ts`
- Ensure `ctx.state.user` is set from session

### "Spotify client ID missing"

- Check `SPOTIFY_CLIENT_ID` in `.env`
- Verify `.env` file is in `backend/` directory
