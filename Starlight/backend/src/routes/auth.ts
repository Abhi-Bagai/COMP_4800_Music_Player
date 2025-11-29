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

    // Restore userId to session (important for subsequent authenticated requests)
    ctx.session!.userId = userId;

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

    // Check if this Spotify account is already linked to a user
    const existingAccount = await prisma.spotifyAccount.findUnique({
      where: { spotifyUserId: spotifyProfile.id },
    });

    if (existingAccount) {
      // Spotify account already exists - update it (handles re-authentication)
      await prisma.spotifyAccount.update({
        where: { spotifyUserId: spotifyProfile.id },
        data: {
          userId, // Update userId in case user is re-authenticating
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || '',
          expiresAt,
          scope: tokenResponse.scope,
          updatedAt: new Date(),
        },
      });
    } else {
      // Check if user already has a Spotify account linked
      const userAccount = await prisma.spotifyAccount.findUnique({
        where: { userId },
      });

      if (userAccount) {
        // User has existing account, update it
        await prisma.spotifyAccount.update({
          where: { userId },
          data: {
            spotifyUserId: spotifyProfile.id,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token || '',
            expiresAt,
            scope: tokenResponse.scope,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new account
        await prisma.spotifyAccount.create({
          data: {
            userId,
            spotifyUserId: spotifyProfile.id,
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token || '',
            expiresAt,
            scope: tokenResponse.scope,
          },
        });
      }
    }

    // Clean up login attempt
    await prisma.spotifyLoginAttempt.delete({
      where: { state: state as string },
    });

    // Ensure session is saved with userId before redirect
    // koa-session will auto-save, but we log to verify
    if (config.nodeEnv === 'development') {
      console.log('✓ OAuth callback complete. Session userId:', ctx.session?.userId);
    }

    // Redirect to frontend with success
    // For web development, use localhost:8081; for production, use configured URL
    let redirectUrl: string;
    if (config.nodeEnv === 'development') {
      // In development, redirect to localhost:8081 (Expo web default)
      redirectUrl = 'http://localhost:8081/library?spotify_auth=success';
    } else {
      redirectUrl = config.frontend.url
        ? `${config.frontend.url}?spotify_auth=success`
        : `${config.frontend.deepLink}?success=true`;
    }

    console.log('Redirecting to:', redirectUrl);
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
