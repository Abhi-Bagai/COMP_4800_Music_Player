/**
 * Spotify token storage in localStorage
 *
 * Stores access token, refresh token, and expiration time
 */

const STORAGE_KEY = 'starlight:spotify:tokens';

export interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  scope?: string;
}

/**
 * Check if localStorage is available (web only)
 */
function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Save Spotify tokens to localStorage
 */
export function saveSpotifyTokens(tokens: SpotifyTokens): void {
  if (!isStorageAvailable()) {
    console.warn('localStorage not available, tokens not saved');
    return;
  }

  try {
    console.log('Saving tokens to localStorage with key:', STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    // Verify it was saved
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      console.log('✓ Tokens successfully saved to localStorage');
    } else {
      console.error('✗ Tokens were not saved to localStorage (verification failed)');
    }
  } catch (error) {
    console.error('Failed to save Spotify tokens to localStorage:', error);
  }
}

/**
 * Get Spotify tokens from localStorage
 */
export function getSpotifyTokens(): SpotifyTokens | null {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const tokens = JSON.parse(stored) as SpotifyTokens;

    // Check if token is expired
    if (tokens.expiresAt && Date.now() >= tokens.expiresAt) {
      // Token expired, but keep it for refresh
      return tokens;
    }

    return tokens;
  } catch (error) {
    console.error('Failed to read Spotify tokens from localStorage:', error);
    return null;
  }
}

/**
 * Check if access token is expired
 */
export function isTokenExpired(tokens: SpotifyTokens | null): boolean {
  if (!tokens || !tokens.expiresAt) return true;
  return Date.now() >= tokens.expiresAt;
}

/**
 * Clear Spotify tokens from localStorage
 */
export function clearSpotifyTokens(): void {
  if (!isStorageAvailable()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear Spotify tokens from localStorage:', error);
  }
}

/**
 * Get valid access token (checks expiration)
 */
export function getValidAccessToken(): string | null {
  const tokens = getSpotifyTokens();
  if (!tokens) return null;

  // Return token even if expired (backend can refresh it)
  return tokens.accessToken;
}

/**
 * Debug function to check token storage
 * Call this from browser console: window.checkSpotifyTokens()
 */
if (typeof window !== 'undefined') {
  (window as any).checkSpotifyTokens = () => {
    const tokens = getSpotifyTokens();
    console.log('Current tokens in localStorage:', tokens);
    console.log('Storage key:', STORAGE_KEY);
    console.log('Raw localStorage value:', localStorage.getItem(STORAGE_KEY));
    return tokens;
  };

  (window as any).clearSpotifyTokens = () => {
    clearSpotifyTokens();
    console.log('Tokens cleared from localStorage');
  };
}
