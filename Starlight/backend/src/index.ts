import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import session from 'koa-session';
import { config } from './config';
import authRoutes from './routes/auth';
import spotifyRoutes from './routes/spotify';

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
    },
    app
  )
);

// Body parser
app.use(bodyParser());

// CORS (adjust for production)
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*'); // Configure properly in production
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  ctx.set('Access-Control-Allow-Credentials', 'true');

  if (ctx.method === 'OPTIONS') {
    ctx.status = 204;
    return;
  }

  await next();
});

// TODO: Add session middleware that sets ctx.state.user from session
// For now, you'll need to implement this based on your auth system
// Example:
// app.use(async (ctx, next) => {
//   const userId = ctx.session?.userId;
//   if (userId) {
//     const user = await prisma.user.findUnique({ where: { id: userId } });
//     if (user) {
//       ctx.state.user = { id: user.id, email: user.email, name: user.name };
//     }
//   }
//   await next();
// });

// Routes
app.use(authRoutes.routes()).use(authRoutes.allowedMethods());
app.use(spotifyRoutes.routes()).use(spotifyRoutes.allowedMethods());

// Health check
app.use(async (ctx) => {
  if (ctx.path === '/health') {
    ctx.body = { status: 'ok' };
    return;
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

