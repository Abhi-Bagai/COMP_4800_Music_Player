import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/src/theme/provider';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/src/components/ui/text';
import { Button } from '@/src/components/ui/button';
import {
  checkSpotifyStatus,
  getSpotifyPlaylists,
  getSpotifyAuthUrl,
  importSpotifyPlaylist,
  type SpotifyPlaylist,
} from '@/src/services/spotify-api';
import { createPlaylist } from '@/src/db/playlist-repository';
import { hydratePlaylistsFromDatabase } from '@/src/services/playlist-service';
import { usePlaylistStore } from '@/src/state/playlist-store';

interface SpotifyPlaylistImportScreenProps {
  onBack: () => void;
}

export function SpotifyPlaylistImportScreen({ onBack }: SpotifyPlaylistImportScreenProps) {
  const { tokens } = useTheme();
  const { playlists: localPlaylists } = usePlaylistStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<{ displayName: string; image: string | null } | null>(
    null
  );

  // Check authentication status on mount and handle redirects
  useEffect(() => {
    // Check for OAuth callback parameters (web)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('spotify_auth') === 'success';
      const error = urlParams.get('spotify_auth') === 'error' || urlParams.get('error');

      if (success || error) {
        // Clean up URL
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        if (success) {
          // Wait a moment for backend to process, then check status
          setTimeout(() => {
            checkAuthStatus();
          }, 1000);
          return;
        }
      }
    }

    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const status = await checkSpotifyStatus();
      setIsLinked(status.linked);
      if (status.linked && status.profile) {
        setProfile({
          displayName: status.profile.displayName,
          image: status.profile.image,
        });
        // Fetch playlists if authenticated
        await loadPlaylists();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      Alert.alert('Error', 'Failed to check Spotify connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const result = await getSpotifyPlaylists();
      setSpotifyPlaylists(result.playlists);
    } catch (error) {
      console.error('Error loading playlists:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load Spotify playlists'
      );
    }
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      const authUrl = getSpotifyAuthUrl();

      if (Platform.OS === 'web') {
        // For web, open in same window
        // The backend will redirect back, and we'll check auth status on return
        window.location.href = authUrl;
        // Note: After redirect, the page will reload and we can check auth status
      } else {
        // For mobile, use WebBrowser with deep link callback
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          'starlight://auth/spotify/success'
        );

        if (result.type === 'success') {
          // Wait a bit for backend to process callback
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await checkAuthStatus();
        } else if (result.type === 'cancel') {
          // User cancelled
          setIsAuthenticating(false);
        }
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      Alert.alert('Error', 'Failed to authenticate with Spotify');
      setIsAuthenticating(false);
    }
  };

  const togglePlaylistSelection = (playlistId: string) => {
    setSelectedPlaylists((prev) => {
      const next = new Set(prev);
      if (next.has(playlistId)) {
        next.delete(playlistId);
      } else {
        next.add(playlistId);
      }
      return next;
    });
  };

  const handleImport = async () => {
    if (selectedPlaylists.size === 0) {
      Alert.alert('No Selection', 'Please select at least one playlist to import');
      return;
    }

    setIsImporting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const playlistId of selectedPlaylists) {
        try {
          const playlist = spotifyPlaylists.find((p) => p.id === playlistId);
          if (!playlist) continue;

          // Import playlist data from Spotify
          const importResult = await importSpotifyPlaylist(playlistId, playlist.name);

          // Create local playlist
          const localPlaylistId = await createPlaylist({
            name: playlist.name,
            description: playlist.description ?? undefined,
            coverImageUri: playlist.image ?? undefined,
          });

          // TODO: Import tracks into the playlist
          // For now, we just create the playlist structure
          // You'll need to add tracks to the playlist using your playlist service

          successCount++;
        } catch (error) {
          console.error(`Error importing playlist ${playlistId}:`, error);
          errorCount++;
        }
      }

      // Refresh playlists
      await hydratePlaylistsFromDatabase();

      Alert.alert(
        'Import Complete',
        `Successfully imported ${successCount} playlist(s)${errorCount > 0 ? `\nFailed to import ${errorCount} playlist(s)` : ''}`
      );

      // Clear selection and go back
      setSelectedPlaylists(new Set());
      onBack();
    } catch (error) {
      console.error('Error during import:', error);
      Alert.alert('Error', 'Failed to import playlists');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.header}>
          <Button variant="ghost" onPress={onBack}>
            <IconSymbol name="chevron.left" size={20} color={tokens.colors.text} />
          </Button>
          <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>
            Get Spotify Playlists
          </Text>
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={[styles.loadingText, { color: tokens.colors.subtleText }]}>
            Checking connection...
          </Text>
        </View>
      </View>
    );
  }

  if (!isLinked) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.header}>
          <Button variant="ghost" onPress={onBack}>
            <IconSymbol name="chevron.left" size={20} color={tokens.colors.text} />
          </Button>
          <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>
            Get Spotify Playlists
          </Text>
        </View>
        <View style={styles.centerContent}>
          <IconSymbol name="cloud" size={64} color={tokens.colors.subtleText} />
          <Text style={[styles.title, { color: tokens.colors.text }]}>
            Connect Your Spotify Account
          </Text>
          <Text style={[styles.description, { color: tokens.colors.subtleText }]}>
            Connect your Spotify account to import your playlists into Starlight.
          </Text>
          <Button
            variant="primary"
            onPress={handleAuthenticate}
            disabled={isAuthenticating}
            style={styles.authButton}>
            {isAuthenticating ? (
              <>
                <ActivityIndicator size="small" color={tokens.colors.onPrimary} />
                <Text style={[styles.buttonText, { color: tokens.colors.onPrimary }]}>
                  Connecting...
                </Text>
              </>
            ) : (
              <>
                <IconSymbol name="cloud" size={20} color={tokens.colors.onPrimary} />
                <Text style={[styles.buttonText, { color: tokens.colors.onPrimary }]}>
                  Connect Spotify
                </Text>
              </>
            )}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: tokens.colors.background }]}>
        <Button variant="ghost" onPress={onBack}>
          <IconSymbol name="chevron.left" size={20} color={tokens.colors.text} />
        </Button>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>
            Import Spotify Playlists
          </Text>
          {profile && (
            <Text style={[styles.profileText, { color: tokens.colors.subtleText }]}>
              {profile.displayName}
            </Text>
          )}
        </View>
        {selectedPlaylists.size > 0 && (
          <Button
            variant="primary"
            onPress={handleImport}
            disabled={isImporting}
            style={styles.importButton}>
            {isImporting ? (
              <ActivityIndicator size="small" color={tokens.colors.onPrimary} />
            ) : (
              <Text style={[styles.buttonText, { color: tokens.colors.onPrimary }]}>
                Import ({selectedPlaylists.size})
              </Text>
            )}
          </Button>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {spotifyPlaylists.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={[styles.emptyText, { color: tokens.colors.subtleText }]}>
              No playlists found
            </Text>
          </View>
        ) : (
          <View style={styles.playlistList}>
            {spotifyPlaylists.map((playlist) => {
              const isSelected = selectedPlaylists.has(playlist.id);
              const alreadyImported = localPlaylists.some((p) => p.name === playlist.name);

              return (
                <Pressable
                  key={playlist.id}
                  style={[
                    styles.playlistItem,
                    {
                      backgroundColor: isSelected
                        ? tokens.colors.surfaceElevated
                        : tokens.colors.surface,
                      borderColor: isSelected ? tokens.colors.primary : tokens.colors.background,
                    },
                  ]}
                  onPress={() => togglePlaylistSelection(playlist.id)}
                  disabled={alreadyImported}>
                  <View style={styles.checkbox}>
                    {isSelected && (
                      <IconSymbol
                        name="checkmark.circle.fill"
                        size={24}
                        color={tokens.colors.primary}
                      />
                    )}
                    {!isSelected && (
                      <IconSymbol name="circle" size={24} color={tokens.colors.subtleText} />
                    )}
                  </View>
                  {playlist.image && (
                    <View style={styles.playlistImage}>
                      {/* You can use expo-image here for better image handling */}
                      <View
                        style={[
                          styles.imagePlaceholder,
                          { backgroundColor: tokens.colors.surfaceElevated },
                        ]}
                      />
                    </View>
                  )}
                  <View style={styles.playlistInfo}>
                    <Text
                      style={[
                        styles.playlistName,
                        {
                          color: alreadyImported ? tokens.colors.subtleText : tokens.colors.text,
                        },
                      ]}
                      numberOfLines={1}>
                      {playlist.name}
                    </Text>
                    <Text
                      style={[styles.playlistMeta, { color: tokens.colors.subtleText }]}
                      numberOfLines={1}>
                      {playlist.trackCount} tracks • {playlist.ownerName}
                      {alreadyImported && ' • Already imported'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileText: {
    fontSize: 12,
    marginTop: 2,
  },
  authButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  playlistList: {
    padding: 16,
    gap: 8,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistImage: {
    width: 56,
    height: 56,
    borderRadius: 4,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  playlistInfo: {
    flex: 1,
    gap: 4,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '500',
  },
  playlistMeta: {
    fontSize: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
