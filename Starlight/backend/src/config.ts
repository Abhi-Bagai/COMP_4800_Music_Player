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
    // For local development, use http://127.0.0.1 (localhost is NOT allowed by Spotify)
    // For production, MUST use https://
    redirectUri:
      process.env.SPOTIFY_REDIRECT_URI ||
      (process.env.NODE_ENV === 'production'
        ? 'https://your-backend-url.com/auth/spotify/callback'
        : 'http://127.0.0.1:3001/auth/spotify/callback'),
    authUrl: 'https://accounts.spotify.com/authorize',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiUrl: 'https://api.spotify.com/v1',
    scopes: [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read', // Required for /me/tracks (saved tracks)
    ].join(' '),
  },

  frontend: {
    deepLink: process.env.FRONTEND_DEEP_LINK || 'starlight://auth/spotify/success',
    url: process.env.FRONTEND_URL || 'https://poetic-empanada-73279a.netlify.app',
  },

  cache: {
    ttl: parseInt(process.env.SPOTIFY_CACHE_TTL || '300', 10), // 5 minutes default
  },
};

// Validate required environment variables
if (!config.spotify.clientId || !config.spotify.clientSecret) {
  throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
}

// Validate redirect URI follows Spotify requirements
const redirectUri = config.spotify.redirectUri;
if (config.nodeEnv === 'production') {
  // Production: Must use HTTPS
  if (!redirectUri.startsWith('https://')) {
    throw new Error(
      'SPOTIFY_REDIRECT_URI must use HTTPS in production. ' +
        'For local development, use http://127.0.0.1:PORT (localhost is not allowed).'
    );
  }
} else {
  // Development: Must use http://127.0.0.1 or http://[::1] (localhost is NOT allowed)
  if (!redirectUri.startsWith('http://127.0.0.1') && !redirectUri.startsWith('http://[::1]')) {
    console.warn(
      '⚠️  Spotify does not allow "localhost" as redirect URI. ' +
        'Use http://127.0.0.1:3001/auth/spotify/callback instead.'
    );
  }
}
