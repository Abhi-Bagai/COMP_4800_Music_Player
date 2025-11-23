import { Context } from 'koa';
import Router from 'koa-router';
import { config } from '../config';
import { prisma } from '../db/client';

const router = new Router({ prefix: '/test' });

/**
 * GET /test/health
 * Simple health check endpoint (no auth required)
 */
router.get('/health', async (ctx: Context) => {
  ctx.body = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  };
});

/**
 * GET /test/db
 * Test database connection (no auth required)
 */
router.get('/db', async (ctx: Context) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    ctx.body = {
      status: 'ok',
      message: 'Database connection successful',
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = {
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

/**
 * GET /test/config
 * Check configuration (no auth required, but hides secrets)
 */
router.get('/config', async (ctx: Context) => {
  ctx.body = {
    port: config.port,
    nodeEnv: config.nodeEnv,
    spotify: {
      clientId: config.spotify.clientId ? '***configured***' : 'missing',
      redirectUri: config.spotify.redirectUri,
      authUrl: config.spotify.authUrl,
      scopes: config.spotify.scopes,
    },
    frontend: {
      deepLink: config.frontend.deepLink,
    },
    cache: {
      ttl: config.cache.ttl,
    },
  };
});

export default router;
