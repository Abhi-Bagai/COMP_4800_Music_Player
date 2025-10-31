import { IconSymbol } from '@/components/ui/icon-symbol';
import { MiniPlayer } from '@/src/components/mini-player';
import { NowPlaying } from '@/src/components/now-playing';
import { DragOverlay } from '@/src/components/drag-overlay';
import { PlaylistCreationModal } from '@/src/components/playlist-creation-modal';
import { Button } from '@/src/components/ui/button';
import { IconButton } from '@/src/components/ui/icon-button';
import { Text } from '@/src/components/ui/text';
import { playTrack } from '@/src/services/playback-service';
import { deletePlaylistById, hydratePlaylistsFromDatabase, getPlaylistDetails, addTrackToPlaylistById, isTrackInPlaylist } from '@/src/services/playlist-service';
import { usePlayerStore, usePlaylistStore } from '@/src/state';
import { useTheme } from '@/src/theme/provider';
import { useDrag } from '@/src/contexts/drag-context';
import { addTrackToPlaylist } from '@/src/db/playlist-repository';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

interface PlaylistsScreenProps {
  onPlaylistPress: (playlistId: string) => void;
}

export function PlaylistsScreen({ onPlaylistPress }: PlaylistsScreenProps) {
  const { tokens } = useTheme();
  const { activeTrack } = usePlayerStore();
  const { playlists, isLoading } = usePlaylistStore();
  const { draggedTrack, hoveredPlaylistId, setHoveredPlaylistId, setDraggedTrack, setDragPosition } = useDrag();
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [showPlaylistCreation, setShowPlaylistCreation] = useState(false);
  const [playlistRefs, setPlaylistRefs] = useState<Record<string, any>>({});

  useEffect(() => {
    hydratePlaylistsFromDatabase();
  }, []);

  // Monitor drag position to detect when over a playlist (web only)
  useEffect(() => {
    if (!draggedTrack || Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.pageX || e.clientX;
      const y = e.pageY || e.clientY;

      // Check each playlist item's position using elementFromPoint
      const element = document.elementFromPoint(x, y);
      if (element) {
        // Find the closest playlist item by checking parent elements
        let currentElement: HTMLElement | null = element as HTMLElement;
        let playlistId: string | null = null;

        while (currentElement && !playlistId) {
          const dataPlaylistId = currentElement.getAttribute('data-playlist-id');
          if (dataPlaylistId) {
            playlistId = dataPlaylistId;
            break;
          }
          currentElement = currentElement.parentElement;
        }

        if (playlistId && hoveredPlaylistId !== playlistId) {
          setHoveredPlaylistId(playlistId);
        } else if (!playlistId && hoveredPlaylistId) {
          setHoveredPlaylistId(null);
        }
      }
    };

    const handleMouseUp = async () => {
      // Handle drop when mouse is released over a playlist
      if (hoveredPlaylistId && draggedTrack) {
        await handleDrop(hoveredPlaylistId);
      }
      setHoveredPlaylistId(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedTrack, hoveredPlaylistId]);

  const handleDrop = async (playlistId: string) => {
    if (!draggedTrack) return;

    try {
      const alreadyInPlaylist = await isTrackInPlaylist(playlistId, draggedTrack.id);
      if (alreadyInPlaylist) {
        if (Platform.OS === 'web') {
          alert('This track is already in the playlist');
        }
        return;
      }

      await addTrackToPlaylistById(playlistId, draggedTrack.id);
      
      setDraggedTrack(null);
      setDragPosition(null);
      setHoveredPlaylistId(null);

      if (Platform.OS === 'web') {
        alert(`Added "${draggedTrack.title}" to playlist`);
      }
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add track to playlist';
      if (Platform.OS === 'web') {
        alert(errorMessage);
      }
    }
  };

  const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
    const confirmMessage = `Delete playlist "${playlistName}"? This cannot be undone.`;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        deletePlaylistNow(playlistId);
      }
    } else {
      Alert.alert(
        'Delete Playlist',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deletePlaylistNow(playlistId) },
        ]
      );
    }
  };

  const deletePlaylistNow = async (playlistId: string) => {
    try {
      await deletePlaylistById(playlistId);
      hydratePlaylistsFromDatabase();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      if (Platform.OS === 'web') {
        alert('Failed to delete playlist');
      } else {
        Alert.alert('Error', 'Failed to delete playlist');
      }
    }
  };

  const handlePlayPlaylist = async (playlist: any) => {
    try {
      // Get the playlist details with tracks
      const playlistDetails = await getPlaylistDetails(playlist.id);
      if (playlistDetails && playlistDetails.tracks.length > 0) {
        // Play the first track in the playlist
        const firstTrack = playlistDetails.tracks[0];
        if (firstTrack && firstTrack.track) {
          playTrack(firstTrack.track as any);
        }
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
      // Fallback to navigating to playlist detail
      onPlaylistPress(playlist.id);
    }
  };

  const styles = getStyles(tokens);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: tokens.colors.subtleText }]}>
            Loading playlists...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconSymbol
            name="music.note.list"
            size={24}
            color={tokens.colors.text}
          />
          <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>
            Playlists
          </Text>
        </View>
        <Button
          size="sm"
          variant="primary"
          className="flex-row items-center px-3 py-1.5 rounded-md gap-1.5"
          onPress={() => setShowPlaylistCreation(true)}
        >
          <IconSymbol
            name="plus"
            size={16}
            color={tokens.colors.onPrimary}
          />
          <Text className="text-primary-foreground text-xs font-semibold">
            New Playlist
          </Text>
        </Button>
      </View>

      {/* Playlists List */}
      {playlists.length > 0 ? (
        <FlatList
          data={playlists}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contentContainer,
            activeTrack && styles.contentContainerWithMini,
          ]}
          renderItem={({ item }) => {
            const playlistRef = React.useRef<View>(null);
            const isHovered = hoveredPlaylistId === item.id;
            const canDrop = draggedTrack && !isTrackInPlaylist?.(item.id, draggedTrack.id);

            // Store ref for drag position checking
            React.useEffect(() => {
              setPlaylistRefs((prev) => ({ ...prev, [item.id]: playlistRef }));
            }, [item.id]);

            return (
              <Swipeable
                overshootRight={false}
                renderRightActions={() => (
                  <Pressable
                    onPress={() => handleDeletePlaylist(item.id, item.name)}
                    style={[styles.swipeDelete, { backgroundColor: tokens.colors.danger }]}
                    accessibilityLabel="Delete playlist"
                  >
                    <IconSymbol name="trash" size={20} color={tokens.colors.surface} />
                  </Pressable>
                )}
              >
                <View ref={playlistRef}>
                  <Pressable
                    data-playlist-id={Platform.OS === 'web' ? item.id : undefined}
                    style={({ pressed }) => [
                      styles.playlistItem,
                      {
                        backgroundColor: isHovered && draggedTrack
                          ? tokens.colors.primary + '20'
                          : pressed
                          ? tokens.colors.surfaceElevated
                          : tokens.colors.surface,
                        borderWidth: isHovered && draggedTrack ? 2 : 0,
                        borderColor: isHovered && draggedTrack ? tokens.colors.primary : 'transparent',
                      },
                    ]}
                    onPress={async () => {
                      if (draggedTrack) {
                        await handleDrop(item.id);
                      } else {
                        onPlaylistPress(item.id);
                      }
                    }}
                  >
                <View style={styles.playlistContent}>
                  {/* Playlist Artwork Placeholder */}
                  <View style={[styles.playlistArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
                    <IconSymbol name="music.note.list" size={24} color={tokens.colors.subtleText} />
                  </View>

                  {/* Playlist Info */}
                  <View style={styles.playlistInfo}>
                    <Text
                      style={[styles.playlistName, { color: tokens.colors.text }]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text
                        style={[styles.playlistDescription, { color: tokens.colors.subtleText }]}
                        numberOfLines={1}
                      >
                        {item.description}
                      </Text>
                    )}
                    <Text style={[styles.playlistStats, { color: tokens.colors.subtleText }]}>
                      {item.trackCount} songs
                    </Text>
                  </View>

                  {/* Delete Button */}
                  <IconButton
                    icon={
                      <IconSymbol name="trash" size={20} color={tokens.colors.danger} />
                    }
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeletePlaylist(item.id, item.name);
                    }}
                    accessibilityLabel="Delete playlist"
                  />
                </View>
                  </Pressable>
                </View>
              </Swipeable>
            );
          }}
          keyExtractor={(item) => item.id}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: tokens.colors.surfaceElevated }]}>
            <IconSymbol name="music.note.list" size={48} color={tokens.colors.subtleText} />
          </View>
          <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>
            No Playlists Yet
          </Text>
          <Text style={[styles.emptyText, { color: tokens.colors.subtleText }]}>
            Create your first playlist to organize your music
          </Text>
          <Button
            onPress={() => setShowPlaylistCreation(true)}
            className="mt-6 px-8"
          >
            Create Playlist
          </Button>
        </View>
      )}

      {/* Drag Overlay */}
      <DragOverlay />

      {/* Mini Player */}
      {activeTrack && (
        <MiniPlayer onPress={() => setShowNowPlaying(true)} />
      )}

      {/* Now Playing Modal */}
      <NowPlaying visible={showNowPlaying} onClose={() => setShowNowPlaying(false)} />

      {/* Playlist Creation Modal */}
      <PlaylistCreationModal
        visible={showPlaylistCreation}
        onClose={() => setShowPlaylistCreation(false)}
        onPlaylistCreated={() => {
          hydratePlaylistsFromDatabase();
        }}
      />
    </View>
  );
}

function getStyles(tokens: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
    },
    contentContainer: {
      paddingBottom: 100,
    },
    contentContainerWithMini: {
      paddingBottom: 180,
    },
    playlistItem: {
      marginHorizontal: 16,
      marginVertical: 4,
      borderRadius: 8,
    },
    playlistContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 16,
    },
    playlistArt: {
      width: 56,
      height: 56,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playlistInfo: {
      flex: 1,
      gap: 4,
    },
    playlistName: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    },
    playlistDescription: {
      fontSize: 14,
      lineHeight: 18,
    },
    playlistStats: {
      fontSize: 13,
      lineHeight: 16,
    },
    swipeDelete: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      marginVertical: 4,
      borderTopLeftRadius: 8,
      borderBottomLeftRadius: 8,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
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
      textAlign: 'center',
    },
    emptyText: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
}
