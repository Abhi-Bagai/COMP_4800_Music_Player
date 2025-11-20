/**
 * Application configuration loaded from environment variables
 */

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',

  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID!,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiUrl: 'https://api.spotify.com/v1',
    scopes: [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
    ].join(' '),
  },

  frontend: {
    deepLink: process.env.FRONTEND_DEEP_LINK || 'starlight://auth/spotify/success',
  },

  cache: {
    ttl: parseInt(process.env.SPOTIFY_CACHE_TTL || '300', 10), // 5 minutes default
  },
};

// Validate required environment variables
if (!config.spotify.clientId || !config.spotify.clientSecret) {
  throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
}

