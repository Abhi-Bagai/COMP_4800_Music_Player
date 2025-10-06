import { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { AddToPlaylistModal } from '@/src/components/add-to-playlist-modal';
import { AlbumsScreen } from '@/src/components/albums-screen';
import { ArtistsScreen } from '@/src/components/artists-screen';
import { FolderPicker } from '@/src/components/folder-picker';
import { MiniPlayer } from '@/src/components/mini-player';
import { NowPlaying } from '@/src/components/now-playing';
import { PlaylistCreationModal } from '@/src/components/playlist-creation-modal';
import { PlaylistDetailScreen } from '@/src/components/playlist-detail-screen';
import { Button } from '@/src/components/ui/button';
import { IconButton } from '@/src/components/ui/icon-button';
import { Text } from '@/src/components/ui/text';
import { clearLibrary, deleteTrack, hydrateLibraryFromDatabase } from '@/src/services/library-service';
import { playTrack } from '@/src/services/playback-service';
import { hydratePlaylistsFromDatabase } from '@/src/services/playlist-service';
import { useLibraryStore, usePlayerStore, usePlaylistStore } from '@/src/state';
import { useTheme } from '@/src/theme/provider';

export default function HomeScreen() {
  const { tokens } = useTheme();
  const { tracks, isLoading } = useLibraryStore();
  const { activeTrack } = usePlayerStore();
  const { playlists } = usePlaylistStore();
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [showPlaylistCreation, setShowPlaylistCreation] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'library' | 'artists' | 'albums'>('library');

  useEffect(() => {
    hydrateLibraryFromDatabase();
    hydratePlaylistsFromDatabase();
  }, []);

  const handlePickMusicFolders = () => {
    setShowFolderPicker(true);
  };

  const handleScanComplete = () => {
    setShowFolderPicker(false);
    hydrateLibraryFromDatabase(); // Refresh the library
  };

  const handleScanError = (error: Error) => {
    setShowFolderPicker(false);
    console.error('Scan error:', error);
  };

  const handleDeleteTrack = (track: any) => {
    console.log('Delete button pressed for track:', track.title);

    if (Platform.OS === 'web') {
      // Use browser confirm for web
      const confirmed = window.confirm(`Are you sure you want to delete "${track.title}"?`);
      if (confirmed) {
        deleteTrackNow(track);
      }
      return;
    }

    Alert.alert(
      'Delete Track',
      `Are you sure you want to delete "${track.title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTrackNow(track),
        },
      ]
    );
  };

  const deleteTrackNow = async (track: any) => {
    try {
      console.log('Deleting track:', track.id);
      await deleteTrack(track.id);
      console.log('Track deleted successfully');
    } catch (error) {
      console.error('Error deleting track:', error);
      Alert.alert('Error', 'Failed to delete track');
    }
  };

  const handleAddToPlaylist = (track: any) => {
    setSelectedTrack(track);
    setShowAddToPlaylist(true);
  };

  const handlePlaylistPress = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
  };

  const handleClearLibrary = async () => {
    // Web Alert has only one button, so use confirm dialog instead
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && typeof window.confirm === 'function'
        ? window.confirm('Are you sure you want to delete ALL tracks from your library? This cannot be undone.')
        : true;
      if (!confirmed) return;
      try {
        // Clear UI immediately, then clear DB and rehydrate
        useLibraryStore.getState().setTracks([]);
        await clearLibrary();
        Alert.alert('Success', 'Library cleared successfully');
      } catch (error) {
        console.error('Error clearing library:', error);
        Alert.alert('Error', 'Failed to clear library');
      }
      return;
    }

    Alert.alert(
      'Clear Library',
      'Are you sure you want to delete ALL tracks from your library? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              useLibraryStore.getState().setTracks([]);
              await clearLibrary();
              Alert.alert('Success', 'Library cleared successfully');
            } catch (error) {
              console.error('Error clearing library:', error);
              Alert.alert('Error', 'Failed to clear library');
            }
          },
        },
      ]
    );
  };

  if (showFolderPicker) {
    return (
      <FolderPicker
        onScanComplete={handleScanComplete}
        onScanError={handleScanError}
        onBack={() => setShowFolderPicker(false)}
      />
    );
  }

  if (selectedPlaylistId) {
    return (
      <PlaylistDetailScreen
        playlistId={selectedPlaylistId}
        onBack={() => setSelectedPlaylistId(null)}
        onPlaylistDeleted={() => {
          setSelectedPlaylistId(null);
          hydratePlaylistsFromDatabase();
        }}
      />
    );
  }

  if (currentView === 'artists') {
    return (
      <ArtistsScreen onBack={() => setCurrentView('library')} />
    );
  }

  if (currentView === 'albums') {
    return (
      <AlbumsScreen onBack={() => setCurrentView('library')} />
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: tokens.colors.background }]}>
      <FlatList
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: activeTrack ? 80 : 0 },
        ]}
        data={tracks}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
        <View>
          {/* Header */}
          <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 40 }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>
                Your Library
              </Text>
              <View style={styles.headerActions}>
                <IconButton
                  icon={<IconSymbol name="magnifyingglass" size={24} color={tokens.colors.text} />}
                  accessibilityLabel="Search"
                />
                <IconButton
                  icon={<IconSymbol name="plus" size={24} color={tokens.colors.text} />}
                  onPress={handlePickMusicFolders}
                  accessibilityLabel="Add music"
                />
              </View>
            </View>
          </View>

          {/* Recently Played / Quick Actions */}
          {tracks.length > 0 && (
            <View style={styles.quickActions}>
              <View style={[styles.quickActionCard, { backgroundColor: tokens.colors.primary }]}>
                <IconSymbol name="shuffle" size={24} color={tokens.colors.onPrimary} />
                <Text style={[styles.quickActionText, { color: tokens.colors.onPrimary }]}>
                  Shuffle All
                </Text>
              </View>
            </View>
          )}

          {/* Playlists Section */}
          <View style={styles.playlistsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                Playlists
              </Text>
              <IconButton
                icon={<IconSymbol name="plus" size={20} color={tokens.colors.accent} />}
                onPress={() => setShowPlaylistCreation(true)}
                accessibilityLabel="Create playlist"
              />
            </View>

            {playlists.length === 0 ? (
              <View style={styles.emptyPlaylists}>
                <Text style={[styles.emptyPlaylistsText, { color: tokens.colors.subtleText }]}>
                  Create your first playlist
                </Text>
                <Pressable
                  style={[styles.createPlaylistButton, { borderColor: tokens.colors.accent }]}
                  onPress={() => setShowPlaylistCreation(true)}
                >
                  <IconSymbol name="plus" size={18} color={tokens.colors.accent} />
                  <Text style={[styles.createPlaylistText, { color: tokens.colors.accent }]}>
                    New Playlist
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.playlistGrid}>
                {playlists.slice(0, 6).map((playlist) => (
                  <Pressable
                    key={playlist.id}
                    style={[styles.playlistCard, { backgroundColor: tokens.colors.surfaceElevated }]}
                    onPress={() => handlePlaylistPress(playlist.id)}
                  >
                    <View style={[styles.playlistArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
                      <IconSymbol name="music.note.list" size={24} color={tokens.colors.subtleText} />
                    </View>
                    <Text
                      style={[styles.playlistTitle, { color: tokens.colors.text }]}
                      numberOfLines={2}
                    >
                      {playlist.name}
                    </Text>
                    <Text style={[styles.playlistSubtitle, { color: tokens.colors.subtleText }]}>
                      {playlist.trackCount} songs
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Browse Section */}
          {tracks.length > 0 && (
            <View style={styles.browseSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                  Browse
                </Text>
              </View>

              <View style={styles.browseGrid}>
                <Pressable
                  style={[styles.browseCard, { backgroundColor: tokens.colors.surfaceElevated }]}
                  onPress={() => setCurrentView('artists')}
                >
                  <View style={[styles.browseIcon, { backgroundColor: tokens.colors.accent + '20' }]}>
                    <IconSymbol name="person.2.fill" size={24} color={tokens.colors.accent} />
                  </View>
                  <Text style={[styles.browseTitle, { color: tokens.colors.text }]}>
                    Artists
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.browseCard, { backgroundColor: tokens.colors.surfaceElevated }]}
                  onPress={() => setCurrentView('albums')}
                >
                  <View style={[styles.browseIcon, { backgroundColor: tokens.colors.accent + '20' }]}>
                    <IconSymbol name="opticaldisc" size={24} color={tokens.colors.accent} />
                  </View>
                  <Text style={[styles.browseTitle, { color: tokens.colors.text }]}>
                    Albums
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Section Header */}
          {tracks.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                Recently Added
              </Text>
              {tracks.length > 0 && (
                <IconButton
                  icon={<IconSymbol name="ellipsis" size={20} color={tokens.colors.subtleText} />}
                  onPress={handleClearLibrary}
                  accessibilityLabel="More options"
                />
              )}
            </View>
          )}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: tokens.colors.surfaceElevated }]}>
            <IconSymbol name="music.note.list" size={48} color={tokens.colors.subtleText} />
          </View>
          <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>
            Your Music Lives Here
          </Text>
          <Text style={[styles.emptySubtitle, { color: tokens.colors.subtleText }]}>
            Add your favorite songs and albums to get started
          </Text>
          <Button
            onPress={handlePickMusicFolders}
            style={styles.emptyAction}
          >
            Add Music
          </Button>
        </View>
      }
      renderItem={({ item }) => (
        <Swipeable
          overshootRight={false}
          renderRightActions={() => (
            <Pressable
              onPress={() => handleDeleteTrack(item)}
              style={[styles.swipeDelete, { backgroundColor: tokens.colors.danger }]}
              accessibilityLabel="Delete track"
            >
              <IconSymbol name="trash" size={20} color={tokens.colors.onPrimary} />
            </Pressable>
          )}
        >
          <Pressable
            style={({ pressed }) => [
              styles.trackItem,
              {
                backgroundColor: pressed
                  ? tokens.colors.surfaceElevated
                  : tokens.colors.surface,
              },
            ]}
            onPress={() => playTrack(item)}
          >
            <View style={styles.trackContent}>
            {/* Album Artwork Placeholder */}
            <View style={[styles.albumArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
              <IconSymbol name="music.note" size={20} color={tokens.colors.subtleText} />
            </View>

            {/* Track Info */}
            <View style={styles.trackInfo}>
              <Text
                style={[styles.trackTitle, { color: tokens.colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.trackSubtitle, { color: tokens.colors.subtleText }]}
                numberOfLines={1}
              >
                {item.artist?.name ?? 'Unknown Artist'} • {item.album?.title ?? 'Unknown Album'}
              </Text>
            </View>

            {/* Track Actions */}
            <View style={styles.trackActions}>
              <View style={styles.trackActionsTop}>
                <Text style={[styles.trackDuration, { color: tokens.colors.subtleText }]}>
                  {formatTrackDuration(item.durationMs)}
                </Text>
              </View>
              <View style={styles.trackButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: pressed
                        ? tokens.colors.accent + '20'
                        : 'transparent',
                    }
                  ]}
                  onPress={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleAddToPlaylist(item);
                  }}
                  accessibilityLabel="Add to playlist"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol name="plus" size={18} color={tokens.colors.accent} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    {
                      backgroundColor: pressed
                        ? tokens.colors.danger + '20'
                        : 'transparent',
                    }
                  ]}
                  onPress={(e) => {
                    console.log('Delete button pressed!');
                    e.stopPropagation();
                    e.preventDefault();
                    handleDeleteTrack(item);
                  }}
                  accessibilityLabel="Delete track"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol name="trash" size={18} color={tokens.colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
          </Pressable>
        </Swipeable>
      )}
      keyExtractor={(item) => item.id}
      />

      {/* Mini Player */}
      {activeTrack && (
        <MiniPlayer onPress={() => setShowNowPlaying(true)} />
      )}

      {/* Now Playing Modal */}
      <NowPlaying
        visible={showNowPlaying}
        onClose={() => setShowNowPlaying(false)}
      />

      {/* Playlist Creation Modal */}
      <PlaylistCreationModal
        visible={showPlaylistCreation}
        onClose={() => setShowPlaylistCreation(false)}
        onPlaylistCreated={() => {
          hydratePlaylistsFromDatabase();
        }}
      />

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        visible={showAddToPlaylist}
        onClose={() => {
          setShowAddToPlaylist(false);
          setSelectedTrack(null);
        }}
        track={selectedTrack}
        onPlaylistCreated={() => {
          setShowAddToPlaylist(false);
          setSelectedTrack(null);
          setShowPlaylistCreation(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: {
    flexGrow: 1,
  },

  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Quick Actions
  quickActions: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 12,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyAction: {
    paddingHorizontal: 32,
  },

  // Track Item Styles
  trackItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  trackContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  albumArt: {
    width: 48,
    height: 48,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 20,
  },
  trackSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  trackActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  trackActionsTop: {
    alignItems: 'flex-end',
  },
  trackButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  trackDuration: {
    fontSize: 14,
    fontWeight: '400',
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },

  // Playlist Styles
  playlistsSection: {
    marginBottom: 24,
  },
  emptyPlaylists: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  emptyPlaylistsText: {
    fontSize: 16,
    marginBottom: 16,
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  createPlaylistText: {
    fontSize: 16,
    fontWeight: '500',
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  playlistCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  playlistArt: {
    width: 60,
    height: 60,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  playlistTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  playlistSubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },

  // Browse Styles
  browseSection: {
    marginBottom: 24,
  },
  browseGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  browseCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  browseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});

function formatTrackDuration(duration?: number | null) {
  if (!duration) return '';
  const totalSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
