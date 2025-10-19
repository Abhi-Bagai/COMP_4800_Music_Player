import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button } from '@/src/components/ui/button';
import { addTrackToPlaylistById, isTrackInPlaylist } from '@/src/services/playlist-service';
import { usePlaylistStore } from '@/src/state/playlist-store';
import { useTheme } from '@/src/theme/provider';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  track?: {
    id: string;
    title: string;
    artist?: { name: string } | null;
  } | null;
  onPlaylistCreated?: () => void;
}

export function AddToPlaylistModal({
  visible,
  onClose,
  track,
  onPlaylistCreated,
}: AddToPlaylistModalProps) {
  const { tokens } = useTheme();
  const styles = getStyles(tokens);
  const { playlists } = usePlaylistStore();
  const [playlistTrackStatus, setPlaylistTrackStatus] = useState<Record<string, boolean>>({});

  // Check which playlists already contain the track
  useEffect(() => {
    if (!track || !visible) return;

    const checkPlaylistTrackStatus = async () => {
      const status: Record<string, boolean> = {};
      for (const playlist of playlists) {
        try {
          status[playlist.id] = await isTrackInPlaylist(playlist.id, track.id);
        } catch (error) {
          console.error(`Error checking track status for playlist ${playlist.id}:`, error);
          status[playlist.id] = false;
        }
      }
      setPlaylistTrackStatus(status);
    };

    checkPlaylistTrackStatus();
  }, [track, playlists, visible]);

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    if (!track) return;

    try {
      await addTrackToPlaylistById(playlistId, track.id);

      if (Platform.OS === 'web') {
        alert(`Added "${track.title}" to "${playlistName}"`);
      } else {
        Alert.alert('Success', `Added "${track.title}" to "${playlistName}"`);
      }

      onClose();
    } catch (error) {
      console.error('Error adding track to playlist:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to add track to playlist';

      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handleCreateNewPlaylist = () => {
    onPlaylistCreated?.();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar style="light" />

      {Platform.OS === 'ios' ? (
        <BlurView intensity={100} tint="dark" style={styles.container}>
          <Content
            track={track}
            playlists={playlists}
            playlistTrackStatus={playlistTrackStatus}
            onClose={onClose}
            onAddToPlaylist={handleAddToPlaylist}
            onCreateNewPlaylist={handleCreateNewPlaylist}
            tokens={tokens}
            styles={styles}
          />
        </BlurView>
      ) : (
        <View style={[styles.container, styles.androidContainer]}>
          <Content
            track={track}
            playlists={playlists}
            playlistTrackStatus={playlistTrackStatus}
            onClose={onClose}
            onAddToPlaylist={handleAddToPlaylist}
            onCreateNewPlaylist={handleCreateNewPlaylist}
            tokens={tokens}
            styles={styles}
          />
        </View>
      )}
    </Modal>
  );
}

interface ContentProps {
  track?: {
    id: string;
    title: string;
    artist?: { name: string } | null;
  } | null;
  playlists: any[];
  playlistTrackStatus: Record<string, boolean>;
  onClose: () => void;
  onAddToPlaylist: (playlistId: string, playlistName: string) => void;
  onCreateNewPlaylist: () => void;
  tokens: any;
  styles: any;
}

function Content({
  track,
  playlists,
  playlistTrackStatus,
  onClose,
  onAddToPlaylist,
  onCreateNewPlaylist,
  tokens,
  styles,
}: ContentProps) {
  return (
    <>
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <IconSymbol name="xmark" size={24} color={tokens.colors.subtleText} />
        </Pressable>

        <Text style={styles.title}>Add to Playlist</Text>

        <View style={styles.placeholder} />
      </View>

      {track && (
        <View style={styles.trackInfo}>
          <View style={[styles.trackArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
            <IconSymbol name="music.note" size={20} color={tokens.colors.subtleText} />
          </View>
          <View style={styles.trackDetails}>
            <Text style={[styles.trackTitle, { color: tokens.colors.text }]} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={[styles.trackArtist, { color: tokens.colors.subtleText }]} numberOfLines={1}>
              {track.artist?.name ?? 'Unknown Artist'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Create New Playlist Option */}
        <Pressable
          style={[styles.playlistItem, styles.createNewItem]}
          onPress={onCreateNewPlaylist}
        >
          <View style={[styles.playlistArt, styles.createNewArt, { backgroundColor: tokens.colors.accent }]}>
            <IconSymbol name="plus" size={24} color={tokens.colors.surface} />
          </View>
          <View style={styles.playlistDetails}>
            <Text style={[styles.playlistTitle, { color: tokens.colors.text }]}>
              New Playlist
            </Text>
            <Text style={[styles.playlistSubtitle, { color: tokens.colors.subtleText }]}>
              Create a new playlist
            </Text>
          </View>
        </Pressable>

        {/* Existing Playlists */}
        {playlists.map((playlist) => {
          const isTrackInPlaylist = playlistTrackStatus[playlist.id] || false;
          const isDisabled = isTrackInPlaylist;
          
          return (
            <Pressable
              key={playlist.id}
              style={[
                styles.playlistItem,
                isDisabled && styles.disabledPlaylistItem
              ]}
              onPress={() => !isDisabled && onAddToPlaylist(playlist.id, playlist.name)}
              disabled={isDisabled}
            >
              <View style={[
                styles.playlistArt, 
                { backgroundColor: tokens.colors.surfaceElevated },
                isDisabled && { opacity: 0.5 }
              ]}>
                <IconSymbol 
                  name={isTrackInPlaylist ? "checkmark.circle.fill" : "music.note.list"} 
                  size={24} 
                  color={isTrackInPlaylist ? tokens.colors.accent : tokens.colors.subtleText} 
                />
              </View>
              <View style={styles.playlistDetails}>
                <Text style={[
                  styles.playlistTitle, 
                  { 
                    color: isDisabled ? tokens.colors.subtleText : tokens.colors.text,
                    opacity: isDisabled ? 0.6 : 1
                  }
                ]} numberOfLines={1}>
                  {playlist.name}
                </Text>
                <Text style={[styles.playlistSubtitle, { color: tokens.colors.subtleText }]}>
                  {isTrackInPlaylist ? "Already in playlist" : `${playlist.trackCount} songs`}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {playlists.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: tokens.colors.subtleText }]}>
              You haven&apos;t created any playlists yet.{"\n"}
              Create your first playlist to get started!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Cancel Button */}
      <View style={styles.cancelButtonContainer}>
        <Button
          variant="secondary"
          onPress={onClose}
          style={styles.cancelButton}
        >
          <Text style={[styles.cancelButtonText, { color: tokens.colors.text }]}>
            Cancel
          </Text>
        </Button>
      </View>
    </>
  );
}

function getStyles(tokens: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    androidContainer: {
      backgroundColor: tokens.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: tokens.colors.text,
    },
    closeButton: {
      padding: 8,
    },
    placeholder: {
      width: 40,
    },
    trackInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
      gap: 12,
    },
    trackArt: {
      width: 48,
      height: 48,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    trackDetails: {
      flex: 1,
    },
    trackTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 2,
    },
    trackArtist: {
      fontSize: 14,
    },
    content: {
      flex: 1,
    },
    playlistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    disabledPlaylistItem: {
      opacity: 0.6,
    },
    createNewItem: {
      borderBottomWidth: 1,
      borderBottomColor: tokens.colors.border,
      marginBottom: 8,
    },
    playlistArt: {
      width: 48,
      height: 48,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    createNewArt: {
      // Additional styles for create new playlist art
    },
    playlistDetails: {
      flex: 1,
    },
    playlistTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 2,
    },
    playlistSubtitle: {
      fontSize: 14,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
      paddingTop: 60,
    },
    emptyText: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
    },
    cancelButtonContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: tokens.colors.border,
    },
    cancelButton: {
      width: '100%',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
}