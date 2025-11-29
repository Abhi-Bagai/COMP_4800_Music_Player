import 'dotenv/config';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import session from 'koa-session';
import { config } from './config';
import authRoutes from './routes/auth';
import spotifyRoutes from './routes/spotify';
import testRoutes from './routes/test';

const app = new Koa();

// Session configuration
app.keys = [config.sessionSecret];
app.use(
  session(
    {
      key: 'starlight:sess',
      maxAge: 86400000, // 24 hours
      httpOnly: true,
      signed: true,
      // Allow session cookie to be sent cross-origin in development
      sameSite: config.nodeEnv === 'development' ? 'lax' : 'strict',
    },
    app
  )
);

// Body parser
app.use(bodyParser());

// CORS (adjust for production)
// When using credentials, we cannot use '*' - must specify exact origins
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:19006', // Expo web default
  'http://127.0.0.1:8081',
  'http://127.0.0.1:19006',
  config.frontend.url, // Production frontend URL
].filter(Boolean);

app.use(async (ctx, next) => {
  const origin = ctx.headers.origin;

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    ctx.set('Access-Control-Allow-Origin', origin);
  } else if (config.nodeEnv === 'development' && origin) {
    // In development, allow any localhost origin
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      ctx.set('Access-Control-Allow-Origin', origin);
    }
  }

  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  ctx.set('Access-Control-Allow-Credentials', 'true');

  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }

  await next();
});

// Session middleware that sets ctx.state.user from session
app.use(async (ctx, next) => {
  const userId = ctx.session?.userId;
  if (userId) {
    const { prisma } = await import('./db/client');
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        ctx.state.user = { id: user.id, email: user.email, name: user.name };
        if (config.nodeEnv === 'development') {
          console.log('✓ User loaded from session:', userId);
        }
      }
    } catch (error) {
      console.error('Error loading user from session:', error);
      // Continue without user - will fail auth checks
    }
  } else if (config.nodeEnv === 'development') {
    console.log('⚠ No userId in session. Session:', ctx.session ? 'exists' : 'missing');
  }
  await next();
});

// Routes
app.use(testRoutes.routes()).use(testRoutes.allowedMethods());
app.use(authRoutes.routes()).use(authRoutes.allowedMethods());
app.use(spotifyRoutes.routes()).use(spotifyRoutes.allowedMethods());

// Debug: Log all registered routes
if (config.nodeEnv === 'development') {
  console.log('📋 Registered routes:');
  console.log('  - GET  /test/health');
  console.log('  - GET  /test/db');
  console.log('  - GET  /test/config');
  console.log('  - GET  /auth/spotify/login');
  console.log('  - GET  /auth/spotify/callback');
  console.log('  - GET  /api/spotify/status');
  console.log('  - GET  /api/spotify/tokens');
  console.log('  - GET  /api/spotify/playlists');
}

// Health check (must be before routes or use a specific route)
app.use(async (ctx, next) => {
  if (ctx.path === '/health') {
    ctx.body = { status: 'ok' };
    return;
  }
  await next();
});

// 404 handler - catch all unmatched routes
app.use(async (ctx) => {
  if (ctx.status === 404) {
    ctx.status = 404;
    ctx.body = {
      error: 'Route not found',
      path: ctx.path,
      method: ctx.method,
      availableRoutes: [
        'GET /test/health',
        'GET /test/db',
        'GET /test/config',
        'GET /auth/spotify/login',
        'GET /auth/spotify/callback',
        'GET /api/spotify/status',
        'GET /api/spotify/playlists',
      ],
    };
  }
});

// Error handling
app.on('error', (err, ctx) => {
  console.error('Server error:', err);
  ctx.status = err.status || 500;
  ctx.body = {
    error: err.message || 'Internal server error',
  };
});

// Start server
const port = config.port;
app.listen(port, () => {
  console.log(`🚀 Starlight backend server running on http://localhost:${port}`);
  console.log(`📝 Environment: ${config.nodeEnv}`);
});
