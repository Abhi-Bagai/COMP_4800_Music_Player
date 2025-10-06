import { IconSymbol } from '@/components/ui/icon-symbol';
import { addTrackToPlaylistById } from '@/src/services/playlist-service';
import { usePlaylistStore } from '@/src/state/playlist-store';
import { useTheme } from '@/src/theme/provider';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
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

      if (Platform.OS === 'web') {
        alert('Failed to add track to playlist');
      } else {
        Alert.alert('Error', 'Failed to add track to playlist');
      }
    }
  };

  const handleCreateNewPlaylist = () => {
    onClose();
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
  onClose: () => void;
  onAddToPlaylist: (playlistId: string, playlistName: string) => void;
  onCreateNewPlaylist: () => void;
  tokens: any;
  styles: any;
}

function Content({
  track,
  playlists,
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
        {playlists.map((playlist) => (
          <Pressable
            key={playlist.id}
            style={styles.playlistItem}
            onPress={() => onAddToPlaylist(playlist.id, playlist.name)}
          >
            <View style={[styles.playlistArt, { backgroundColor: tokens.colors.surfaceElevated }]}>
              <IconSymbol name="music.note.list" size={24} color={tokens.colors.subtleText} />
            </View>
            <View style={styles.playlistDetails}>
              <Text style={[styles.playlistTitle, { color: tokens.colors.text }]} numberOfLines={1}>
                {playlist.name}
              </Text>
              <Text style={[styles.playlistSubtitle, { color: tokens.colors.subtleText }]}>
                {playlist.trackCount} songs
              </Text>
            </View>
          </Pressable>
        ))}

        {playlists.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: tokens.colors.subtleText }]}>
              You haven&apos;t created any playlists yet.{"\n"}
              Create your first playlist to get started!
            </Text>
          </View>
        )}
      </ScrollView>
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
  });
}