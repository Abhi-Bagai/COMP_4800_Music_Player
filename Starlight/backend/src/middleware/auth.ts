import { Context, Next } from 'koa';

/**
 * Koa context extension for authenticated user
 */
declare module 'koa' {
  interface BaseContext {
    state: {
      user?: {
        id: string;
        email: string;
        name?: string | null;
      };
    };
  }
}

/**
 * Middleware to require authentication
 * Expects ctx.state.user to be set by session middleware or JWT middleware
 *
 * Usage: router.get('/protected', requireAuth, handler)
 */
export async function requireAuth(ctx: Context, next: Next) {
  if (!ctx.state.user?.id) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
    return;
  }

  await next();
}

/**
 * Helper to get current user ID from context
 * Throws if user is not authenticated
 */
export function getCurrentUserId(ctx: Context): string {
  const userId = ctx.state.user?.id;
  if (!userId) {
    throw new Error('User not authenticated');
  }
  return userId;
}
