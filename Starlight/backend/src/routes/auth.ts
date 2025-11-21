import { Context } from 'koa';
import Router from 'koa-router';
import { config } from '../config';
import { prisma } from '../db/client';
import { getCurrentUserId } from '../middleware/auth';
import { generatePKCE, generateRandomString } from '../utils/crypto';
import { exchangeCodeForToken, fetchSpotifyUserProfile } from '../utils/spotify-api';

const router = new Router({ prefix: '/auth' });

/**
 * GET /auth/spotify/login
 * Initiates Spotify OAuth flow with PKCE
 */
router.get('/spotify/login', async (ctx: Context) => {
  // For OAuth login, we don't require authentication yet
  // Create or get a user ID from session, or create a temporary one
  let userId = ctx.state.user?.id;

  if (!userId) {
    // Create a temporary user ID from session or generate one
    if (!ctx.session?.userId) {
      // Generate a temporary user ID (in production, you'd create a real user)
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      ctx.session!.userId = tempUserId;

      // Create a user in the database if it doesn't exist
      await prisma.user.upsert({
        where: { id: tempUserId },
        create: {
          id: tempUserId,
          email: `temp_${tempUserId}@starlight.local`,
        },
        update: {},
      });
    }
    userId = ctx.session!.userId as string;
  }

  // Generate PKCE parameters
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = generateRandomString(32);

  // Store login attempt in database (expires in 10 minutes)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.spotifyLoginAttempt.create({
    data: {
      userId,
      state,
      codeVerifier,
      codeChallenge,
      redirectUri: config.frontend.deepLink,
      expiresAt,
    },
  });

  // Build Spotify authorization URL
  const authUrl = new URL(config.spotify.authUrl);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', config.spotify.clientId);
  authUrl.searchParams.set('redirect_uri', config.spotify.redirectUri);
  authUrl.searchParams.set('scope', config.spotify.scopes);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');

  // Redirect to Spotify
  ctx.redirect(authUrl.toString());
});

/**
 * GET /auth/spotify/callback
 * Handles Spotify OAuth callback
 */
router.get('/spotify/callback', async (ctx: Context) => {
  const { code, state, error } = ctx.query;

  if (error) {
    // User denied authorization
    const redirectUrl = config.frontend.url
      ? `${config.frontend.url}?spotify_auth=error&error=${error}`
      : `${config.frontend.deepLink}?error=${error}`;
    ctx.redirect(redirectUrl);
    return;
  }

  if (!code || !state) {
    ctx.status = 400;
    ctx.body = { error: 'Missing code or state parameter' };
    return;
  }

  try {
    // Find login attempt by state
    const loginAttempt = await prisma.spotifyLoginAttempt.findUnique({
      where: { state: state as string },
    });

    if (!loginAttempt) {
      ctx.status = 400;
      ctx.body = { error: 'Invalid state parameter' };
      return;
    }

    // Check expiration
    if (new Date() >= loginAttempt.expiresAt) {
      await prisma.spotifyLoginAttempt.delete({
        where: { state: state as string },
      });
      ctx.status = 400;
      ctx.body = { error: 'Login attempt expired' };
      return;
    }

    const userId = loginAttempt.userId;

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(
      code as string,
      loginAttempt.codeVerifier,
      config.spotify.redirectUri
    );

    // Fetch user profile to get Spotify user ID
    const spotifyProfile = await fetchSpotifyUserProfile(tokenResponse.access_token);

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    // Create or update Spotify account
    await prisma.spotifyAccount.upsert({
      where: { userId },
      create: {
        userId,
        spotifyUserId: spotifyProfile.id,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || '', // Should always be present
        expiresAt,
        scope: tokenResponse.scope,
      },
      update: {
        spotifyUserId: spotifyProfile.id,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token || undefined,
        expiresAt,
        scope: tokenResponse.scope,
        updatedAt: new Date(),
      },
    });

    // Clean up login attempt
    await prisma.spotifyLoginAttempt.delete({
      where: { state: state as string },
    });

    // Redirect to frontend with success
    // For web, use the frontend URL; for mobile, use deep link
    const redirectUrl = config.frontend.url
      ? `${config.frontend.url}?spotify_auth=success`
      : `${config.frontend.deepLink}?success=true`;
    ctx.redirect(redirectUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    ctx.status = 500;
    ctx.body = {
      error: 'Failed to complete Spotify authentication',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

export default router;
