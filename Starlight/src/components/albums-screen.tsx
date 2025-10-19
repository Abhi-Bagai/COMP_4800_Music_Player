import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/src/components/ui/button';
import { IconButton } from '@/src/components/ui/icon-button';
import { playTrack } from '@/src/services/playback-service';
import { useLibraryStore } from '@/src/state';
import { useTheme } from '@/src/theme/provider';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AlbumWithTracks {
  id: string;
  title: string;
  artistName: string;
  trackCount: number;
  tracks: any[];
}

interface AlbumsScreenProps {
  onBack: () => void;
}

export function AlbumsScreen({ onBack }: AlbumsScreenProps) {
  const { tokens } = useTheme();
  const styles = getStyles(tokens);
  const { tracks } = useLibraryStore();
  const [albums, setAlbums] = useState<AlbumWithTracks[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithTracks | null>(null);

  useEffect(() => {
    organizeByAlbums();
    // tracks is the only dependency
  }, [tracks]);

  const organizeByAlbums = () => {
    // Group tracks by album
    const albumsMap = new Map<string, AlbumWithTracks>();

    tracks.forEach((track) => {
      const albumTitle = track.album?.title || 'Unknown Album';
      const albumId = track.album?.id || 'unknown';
      const artistName = track.artist?.name || 'Unknown Artist';

      if (!albumsMap.has(albumId)) {
        albumsMap.set(albumId, {
          id: albumId,
          title: albumTitle,
          artistName,
          trackCount: 0,
          tracks: [],
        });
      }

      const album = albumsMap.get(albumId)!;
      album.tracks.push(track);
      album.trackCount++;
    });

    // Sort tracks within each album by disc and track number
    albumsMap.forEach((album) => {
      album.tracks.sort((a, b) => {
        const discA = a.discNumber || 1;
        const discB = b.discNumber || 1;
        const trackA = a.trackNumber || 0;
        const trackB = b.trackNumber || 0;

        if (discA !== discB) return discA - discB;
        return trackA - trackB;
      });
    });

    const sortedAlbums = Array.from(albumsMap.values()).sort((a, b) => a.title.localeCompare(b.title));

    setAlbums(sortedAlbums);
  };

  const handleAlbumPress = (album: AlbumWithTracks) => {
    setSelectedAlbum(album);
  };

  const handlePlayAlbum = (album: AlbumWithTracks) => {
    if (album.tracks.length > 0) {
      playTrack(album.tracks[0]);
    }
  };

  const handleShuffleAlbum = (album: AlbumWithTracks) => {
    if (album.tracks.length > 0) {
      const shuffledTracks = [...album.tracks].sort(() => Math.random() - 0.5);
      playTrack(shuffledTracks[0]);
    }
  };

  if (selectedAlbum) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <AlbumDetailView
          album={selectedAlbum}
          onBack={() => setSelectedAlbum(null)}
          onPlayAlbum={() => handlePlayAlbum(selectedAlbum)}
          onShuffleAlbum={() => handleShuffleAlbum(selectedAlbum)}
          tokens={tokens}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <View style={styles.header}>
        <IconButton
          icon={<IconSymbol name="chevron.left" size={24} color={tokens.colors.text} />}
          onPress={onBack}
          accessibilityLabel="Go back"
        />
        <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>Albums</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={albums}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        renderItem={({ item: album }) => (
          <Pressable
            style={({ pressed }) => [
              styles.albumCard,
              {
                backgroundColor: pressed
                  ? tokens.colors.surfaceElevated
                  : 'transparent',
              },
            ]}
            onPress={() => handleAlbumPress(album)}
          >
            <View style={[styles.albumArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
              <IconSymbol name="opticaldisc" size={48} color={tokens.colors.subtleText} />
            </View>
            <Text style={[styles.albumTitle, { color: tokens.colors.text }]} numberOfLines={2}>
              {album.title}
            </Text>
            <Text style={[styles.albumArtist, { color: tokens.colors.subtleText }]} numberOfLines={1}>
              {album.artistName}
            </Text>
            <Text style={[styles.albumStats, { color: tokens.colors.subtleText }]}>
              {album.trackCount} songs
            </Text>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: tokens.colors.surfaceElevated }]}>
              <IconSymbol name="opticaldisc" size={48} color={tokens.colors.subtleText} />
            </View>
            <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>
              No Albums Found
            </Text>
            <Text style={[styles.emptyText, { color: tokens.colors.subtleText }]}>
              Add some music to see your albums here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

interface AlbumDetailViewProps {
  album: AlbumWithTracks;
  onBack: () => void;
  onPlayAlbum: () => void;
  onShuffleAlbum: () => void;
}

function AlbumDetailView({ album, onBack, onPlayAlbum, onShuffleAlbum, tokens }: AlbumDetailViewProps & { tokens: any }) {
  const styles = getStyles(tokens);
  return (
    <>
      <View style={styles.header}>
        <IconButton
          icon={<IconSymbol name="chevron.left" size={24} color={tokens.colors.text} />}
          onPress={onBack}
          accessibilityLabel="Go back"
        />
        <Text style={[styles.headerTitle, { color: tokens.colors.text }]} numberOfLines={1}>
          {album.title}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={album.tracks}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.albumHeader}>
            <View style={[styles.albumHeaderArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
              <IconSymbol name="opticaldisc" size={80} color={tokens.colors.subtleText} />
            </View>
            <Text style={[styles.albumHeaderTitle, { color: tokens.colors.text }]}>
              {album.title}
            </Text>
            <Text style={[styles.albumHeaderArtist, { color: tokens.colors.subtleText }]}>
              {album.artistName}
            </Text>
            <Text style={[styles.albumHeaderStats, { color: tokens.colors.subtleText }]}>
              {album.trackCount} songs
            </Text>

            <View style={styles.playbackControls}>
              <Button
                onPress={onPlayAlbum}
                style={[styles.playButton, { backgroundColor: tokens.colors.accent }]}
              >
                <IconSymbol name="play.fill" size={20} color={tokens.colors.surface} />
                <Text style={[styles.playButtonText, { color: tokens.colors.surface }]}>
                  Play
                </Text>
              </Button>
              <Button
                onPress={onShuffleAlbum}
                variant="secondary"
                style={styles.shuffleButton}
              >
                <IconSymbol name="shuffle" size={20} color={tokens.colors.text} />
                <Text style={[styles.shuffleButtonText, { color: tokens.colors.text }]}>
                  Shuffle
                </Text>
              </Button>
            </View>

            <View style={styles.tracksHeader}>
              <Text style={[styles.tracksHeaderText, { color: tokens.colors.text }]}>
                Songs
              </Text>
            </View>
          </View>
        }
        renderItem={({ item: track }) => (
          <Pressable
            style={({ pressed }) => [
              styles.trackItem,
              {
                backgroundColor: pressed
                  ? tokens.colors.surfaceElevated
                  : tokens.colors.surface,
              },
            ]}
            onPress={() => playTrack(track)}
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
                  {track.title}
                </Text>
                <Text
                  style={[styles.trackSubtitle, { color: tokens.colors.subtleText }]}
                  numberOfLines={1}
                >
                  {track.artist?.name ?? 'Unknown Artist'} • {track.album?.title ?? 'Unknown Album'}
                </Text>
              </View>

              {/* Track Duration */}
              <Text style={[styles.trackDuration, { color: tokens.colors.subtleText }]}>
                {formatTrackDuration(track.durationMs)}
              </Text>
            </View>
          </Pressable>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
      />
    </>
  );
}

function getStyles(tokens: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: 100,
    },
    gridContainer: {
      paddingHorizontal: 16,
      paddingBottom: 100,
    },
    gridRow: {
      justifyContent: 'space-between',
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
    placeholder: {
      width: 40,
    },

    // Album Grid Styles
    albumCard: {
      width: '48%',
      padding: 12,
      marginBottom: 20,
    },
    albumArt: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    albumTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
      lineHeight: 20,
    },
    albumArtist: {
      fontSize: 14,
      marginBottom: 4,
    },
    albumStats: {
      fontSize: 12,
    },

    // Album Detail Styles
    albumHeader: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 32,
    },
    albumHeaderArt: {
      width: 200,
      height: 200,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    albumHeaderTitle: {
      fontSize: 28,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
    },
    albumHeaderArtist: {
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 8,
    },
    albumHeaderStats: {
      fontSize: 16,
      marginBottom: 24,
    },
    playbackControls: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
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
      alignSelf: 'stretch',
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
    },
    tracksHeaderText: {
      fontSize: 20,
      fontWeight: '600',
    },

    // Track Styles
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

    // Empty State
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingTop: 80,
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