import { IconSymbol } from '@/components/ui/icon-symbol';
import { MiniPlayer } from '@/src/components/mini-player';
import { NowPlaying } from '@/src/components/now-playing';
import { Button } from '@/src/components/ui/button';
import { IconButton } from '@/src/components/ui/icon-button';
import type { PlaylistWithTracks } from '@/src/db/playlist-repository';
import { playTrack } from '@/src/services/playback-service';
import {
  deletePlaylistById,
  getPlaylistDetails,
  removeTrackFromPlaylistById
} from '@/src/services/playlist-service';
import { usePlayerStore } from '@/src/state';
import { useTheme } from '@/src/theme/provider';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PlaylistDetailScreenProps {
  playlistId: string;
  onBack: () => void;
  onPlaylistDeleted?: () => void;
}

export function PlaylistDetailScreen({
  playlistId,
  onBack,
  onPlaylistDeleted,
}: PlaylistDetailScreenProps) {
  const { tokens } = useTheme();
  const styles = getStyles(tokens);
  const { activeTrack, isPlaying } = usePlayerStore();
  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNowPlaying, setShowNowPlaying] = useState(false);

  useEffect(() => {
    loadPlaylistDetails();
  }, [playlistId]);

  const loadPlaylistDetails = async () => {
    try {
      setIsLoading(true);
      const details = await getPlaylistDetails(playlistId);
      setPlaylist(details);
    } catch (error) {
      console.error('Error loading playlist details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTrack = async (track: any) => {
    if (!playlist) return;

    const confirmMessage = `Remove "${track.track.title}" from "${playlist.name}"?`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;
    } else {
      Alert.alert(
        'Remove Track',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => removeTrackNow(track) },
        ]
      );
      return;
    }

    removeTrackNow(track);
  };

  const removeTrackNow = async (track: any) => {
    if (!playlist) return;

    try {
      await removeTrackFromPlaylistById(playlist.id, track.track.id);
      await loadPlaylistDetails(); // Refresh playlist
    } catch (error) {
      console.error('Error removing track:', error);
      if (Platform.OS === 'web') {
        alert('Failed to remove track');
      } else {
        Alert.alert('Error', 'Failed to remove track');
      }
    }
  };

  const handleDeletePlaylist = () => {
    if (!playlist) return;

    const confirmMessage = `Delete playlist "${playlist.name}"? This cannot be undone.`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        deletePlaylistNow();
      }
    } else {
      Alert.alert(
        'Delete Playlist',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: deletePlaylistNow },
        ]
      );
    }
  };

  const deletePlaylistNow = async () => {
    if (!playlist) return;

    try {
      await deletePlaylistById(playlist.id);
      onPlaylistDeleted?.();
      onBack();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      if (Platform.OS === 'web') {
        alert('Failed to delete playlist');
      } else {
        Alert.alert('Error', 'Failed to delete playlist');
      }
    }
  };

  const handlePlayPlaylist = () => {
    if (!playlist || playlist.tracks.length === 0) return;

    // Play the first track in the playlist
    const firstTrack = playlist.tracks[0];
    if (firstTrack) {
      // Cast to any to match the broader playTrack signature during UI render
      playTrack(firstTrack.track as any);
    }
  };

  const handleShufflePlay = () => {
    if (!playlist || playlist.tracks.length === 0) return;

    // Shuffle and play
    const shuffledTracks = [...playlist.tracks].sort(() => Math.random() - 0.5);
    const firstTrack = shuffledTracks[0];
    if (firstTrack) {
      playTrack(firstTrack.track as any);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.header}>
          <IconButton
            icon={<IconSymbol name="chevron.left" size={24} color={tokens.colors.text} />}
            onPress={onBack}
            accessibilityLabel="Go back"
          />
          <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!playlist) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.header}>
          <IconButton
            icon={<IconSymbol name="chevron.left" size={24} color={tokens.colors.text} />}
            onPress={onBack}
            accessibilityLabel="Go back"
          />
          <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>Playlist Not Found</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: tokens.colors.subtleText }]}>
            This playlist could not be found.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <View style={styles.listWrapper}>
        <FlatList
        data={playlist.tracks}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <IconButton
                icon={<IconSymbol name="chevron.left" size={24} color={tokens.colors.text} />}
                onPress={onBack}
                accessibilityLabel="Go back"
              />
              <Text style={[styles.headerTitle, { color: tokens.colors.text }]} numberOfLines={1}>
                {playlist.name}
              </Text>
              <IconButton
                icon={<IconSymbol name="trash" size={24} color={tokens.colors.danger} />}
                onPress={handleDeletePlaylist}
                accessibilityLabel="Delete playlist"
              />
            </View>

            {/* Playlist Info */}
            <View style={styles.playlistInfo}>
              <View style={[styles.playlistArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
                <IconSymbol name="music.note.list" size={64} color={tokens.colors.subtleText} />
              </View>
              <Text style={[styles.playlistName, { color: tokens.colors.text }]}>
                {playlist.name}
              </Text>
              {playlist.description && (
                <Text style={[styles.playlistDescription, { color: tokens.colors.subtleText }]}>
                  {playlist.description}
                </Text>
              )}
              <Text style={[styles.playlistStats, { color: tokens.colors.subtleText }]}>
                {playlist.tracks.length} songs
              </Text>

              {/* Playback Controls */}
              {playlist.tracks.length > 0 && (
                <View style={styles.playbackControls}>
                  <Button
                    onPress={handlePlayPlaylist}
                    style={[styles.playButton, { backgroundColor: tokens.colors.accent }]}
                  >
                    <IconSymbol name="play.fill" size={20} color={tokens.colors.surface} />
                    <Text style={[styles.playButtonText, { color: tokens.colors.surface }]}>
                      Play
                    </Text>
                  </Button>
                  <Button
                    onPress={handleShufflePlay}
                    variant="secondary"
                    style={styles.shuffleButton}
                  >
                    <IconSymbol name="shuffle" size={20} color={tokens.colors.text} />
                    <Text style={[styles.shuffleButtonText, { color: tokens.colors.text }]}>
                      Shuffle
                    </Text>
                  </Button>
                </View>
              )}
            </View>

            {/* Tracks Header */}
            {playlist.tracks.length > 0 && (
              <View style={styles.tracksHeader}>
                <Text style={[styles.tracksHeaderText, { color: tokens.colors.text }]}>
                  Songs
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: tokens.colors.surfaceElevated }]}>
              <IconSymbol name="music.note" size={48} color={tokens.colors.subtleText} />
            </View>
            <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>
              No Songs Yet
            </Text>
            <Text style={[styles.emptyText, { color: tokens.colors.subtleText }]}>
              Add songs to this playlist to get started
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isCurrentlyPlaying = activeTrack?.id === item.track.id && isPlaying;
          
          return (
            <Swipeable
              overshootRight={false}
              renderRightActions={() => (
                <Pressable
                  onPress={() => handleRemoveTrack(item)}
                  style={[styles.swipeRemove, { backgroundColor: tokens.colors.danger }]}
                  accessibilityLabel="Remove from playlist"
                >
                  <IconSymbol name="minus" size={20} color={tokens.colors.surface} />
                </Pressable>
              )}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.trackItem,
                  {
                    backgroundColor: isCurrentlyPlaying
                      ? tokens.colors.primary + '20' // Semi-transparent primary color for currently playing
                      : pressed
                      ? tokens.colors.surfaceElevated
                      : tokens.colors.surface,
                  },
                ]}
                onPress={() => playTrack(item.track as any)}
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
                    {item.track.title}
                  </Text>
                  <Text
                    style={[styles.trackSubtitle, { color: tokens.colors.subtleText }]}
                    numberOfLines={1}
                  >
                    {item.track.artist?.name ?? 'Unknown Artist'} • {item.track.album?.title ?? 'Unknown Album'}
                  </Text>
                </View>

                {/* Track Duration */}
                <Text style={[styles.trackDuration, { color: tokens.colors.subtleText }]}>
                  {formatTrackDuration(item.track.durationMs)}
                </Text>
              </View>
            </Pressable>
          </Swipeable>
          );
        }}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.contentContainer,
          activeTrack && styles.contentContainerWithMini,
        ]}
      />
      </View>

      {activeTrack && (
        <MiniPlayer onPress={() => setShowNowPlaying(true)} />
      )}

      <NowPlaying visible={showNowPlaying} onClose={() => setShowNowPlaying(false)} />
    </SafeAreaView>
  );
}

function getStyles(tokens: any) {
  return StyleSheet.create({
  container: {
    flex: 1,
  },
  listWrapper: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  contentContainerWithMini: {
    paddingBottom: 180,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  playlistInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  playlistArt: {
    width: 180,
    height: 180,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  playlistName: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  playlistStats: {
    fontSize: 16,
    marginBottom: 24,
  },
  playbackControls: {
    flexDirection: 'row',
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  shuffleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tracksHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  tracksHeaderText: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
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
  trackDuration: {
    fontSize: 14,
    fontWeight: '400',
  },
  swipeRemove: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 8,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  });
}

function formatTrackDuration(duration?: number | null) {
  if (!duration) return '';
  const totalSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}
