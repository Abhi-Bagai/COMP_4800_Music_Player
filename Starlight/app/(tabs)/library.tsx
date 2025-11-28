import { useEffect, useState, useMemo, useCallback } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { PanGestureHandler, Swipeable } from 'react-native-gesture-handler';
import * as DocumentPicker from 'expo-document-picker';

import { useTheme } from "@/src/theme/provider";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Settings } from "lucide-react-native";
import { AddToPlaylistModal } from "@/src/components/add-to-playlist-modal";
import { AlbumsScreen } from "@/src/components/albums-screen";
import { ArtistsScreen } from "@/src/components/artists-screen";
import { PlaylistsScreen } from "@/src/components/playlists-screen";
import { SpotifyPlaylistImportScreen } from "@/src/components/spotify-playlist-import-screen";
import { MiniPlayer } from "@/src/components/mini-player";
import { PlaylistCreationModal } from "@/src/components/playlist-creation-modal";
import { PlaylistDetailScreen } from "@/src/components/playlist-detail-screen";
import { SidebarNavigation } from "@/src/components/sidebar-navigation";
import { TableView } from "@/src/components/table-view";
import { TagManager } from "@/src/components/tag-manager";
import { DragOverlay } from "@/src/components/drag-overlay";
import { Button } from "@/src/components/ui/button";
import { DropdownMenu } from "@/src/components/ui/dropdown-menu";
import { Text } from "@/src/components/ui/text";
import { StarlightLogo } from "@/src/components/starlight-logo";
import { FileScanner } from "@/src/services/file-scanner";
import {
  clearLibrary,
  deleteTrack,
  hydrateLibraryFromDatabase,
} from '@/src/services/library-service';
import { getTrackTags, saveTrackTags, getAllTrackTags } from '@/src/services/tag-service';
import { playTrack } from '@/src/services/playback-service';
import {
  hydratePlaylistsFromDatabase,
  clearAllPlaylistsService,
} from '@/src/services/playlist-service';
import { useLibraryStore, usePlayerStore, usePlaylistStore } from '@/src/state';

export default function HomeScreen() {
  const { tokens } = useTheme();
  const { tracks, isLoading } = useLibraryStore();
  const { activeTrack } = usePlayerStore();
  const { playlists } = usePlaylistStore();
  const [showPlaylistCreation, setShowPlaylistCreation] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'library' | 'artists' | 'albums'>('library');
  const [sidebarView, setSidebarView] = useState<string>('library');
  const [showTagManager, setShowTagManager] = useState(false);
  const [selectedTrackForTagging, setSelectedTrackForTagging] = useState<any>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showGearMenu, setShowGearMenu] = useState(false);
  const [showAddMusicMenu, setShowAddMusicMenu] = useState(false);
  const [trackTags, setTrackTags] = useState<{[trackId: string]: string[]}>({});
  const [searchText, setSearchText] = useState("");
  const [isOptionsHovered, setIsOptionsHovered] = useState(false);

  useEffect(() => {
    hydrateLibraryFromDatabase();
    hydratePlaylistsFromDatabase();
    loadTrackTags();
  }, []);

  const loadTrackTags = async () => {
    try {
      const tags = await getAllTrackTags();
      setTrackTags(tags);
    } catch (error) {
      console.error('Error loading track tags:', error);
    }
  };

  // Filter tracks based on search text
  const filteredTracks = useMemo(() => {
    if (!searchText.trim()) {
      return tracks;
    }

    const searchLower = searchText.toLowerCase().trim();
    return tracks.filter((track) => {
      const titleMatch = track.title?.toLowerCase().includes(searchLower);
      const artistMatch = track.artist?.name?.toLowerCase().includes(searchLower);
      const albumMatch = track.album?.title?.toLowerCase().includes(searchLower);

      return titleMatch || artistMatch || albumMatch;
    });
  }, [tracks, searchText]);

  const handlePickMusicFolders = () => {
    setShowAddMusicMenu(true);
  };

  const handlePickFiles = async () => {
    try {
      console.log('Starting file picker...');

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'audio/mpeg',
          'audio/mp3',
          'audio/mp4',
          'audio/m4a',
          'audio/wav',
          'audio/flac',
          'audio/aac',
          'audio/ogg',
          'audio/*',
        ],
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        console.log('Selected files:', result.assets);
        await scanSelectedFiles(result.assets);
      } else {
        console.log('No files selected or picker was canceled');
        Alert.alert('No Files', 'No files were selected. Please try again.');
      }
    } catch (error) {
      console.error('Error picking files:', error);
      Alert.alert('Error', 'Failed to pick music files. Please try again.');
    }
  };

  const handlePickFolder = async () => {
    try {
      console.log('Starting folder picker...');

      if (Platform.OS === 'web') {
        await pickWebFolder();
      } else {
        Alert.alert(
          'Folder Selection Not Available',
          'Folder selection is not available on mobile platforms. Please select individual music files instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Select Files', onPress: handlePickFiles },
          ]
        );
      }
    } catch (error) {
      console.error('Error picking folder:', error);
      Alert.alert('Error', 'Failed to pick folder. Please try again.');
    }
  };

  const pickWebFolder = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      input.accept = '.mp3,.m4a,.mp4,.flac,.wav,.aac,.ogg,.wma';

      input.onchange = async (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          reject(new Error('No files selected'));
          return;
        }

        try {
          console.log('Selected folder with', files.length, 'files');

          const fileArray = Array.from(files);
          const musicFiles = fileArray
            .filter((file) => {
              const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
              return ['.mp3', '.m4a', '.mp4', '.flac', '.wav', '.aac', '.ogg', '.wma'].includes(
                extension
              );
            })
            .map((file) => ({
              uri: URL.createObjectURL(file),
              name: file.name,
              size: file.size,
              modificationTime: file.lastModified,
              file: file,
            }));

          if (musicFiles.length === 0) {
            Alert.alert('No Music Files', 'No music files found in the selected folder.');
            resolve();
            return;
          }

          console.log('Found', musicFiles.length, 'music files in folder');
          await scanSelectedFiles(musicFiles);
          resolve();
        } catch (error) {
          reject(error);
        }
      };

      input.oncancel = () => {
        reject(new Error('Folder selection cancelled'));
      };

      input.click();
    });
  };

  const scanSelectedFiles = async (assets: any[]) => {
    console.log('Starting file scan with assets:', assets);

    try {
      const scanner = new FileScanner(
        (progress) => {
          console.log('Scan progress:', progress);
        },
        (summary) => {
          console.log('Scan completed with summary:', summary);
          hydrateLibraryFromDatabase(); // Refresh the library

          if (summary.skipped > 0) {
            Alert.alert(
              'Import Complete',
              `Added ${summary.added} new track(s)\nSkipped ${summary.skipped} duplicate(s)\nTotal processed: ${summary.total} file(s)`
            );
          } else {
            Alert.alert(
              'Import Complete',
              `Successfully added ${summary.added} track(s) to your library!`
            );
          }
        },
        (error) => {
          console.error('Scan error:', error);
          Alert.alert('Error', `Scan failed: ${error.message}`);
        }
      );

      const musicFiles = assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name || 'Unknown',
        size: asset.size || 0,
        modificationTime: asset.lastModified ? asset.lastModified * 1000 : Date.now(),
      }));

      console.log('Converted music files:', musicFiles);
      await scanner.processMusicFiles(musicFiles);

      console.log('File processing completed');
      hydrateLibraryFromDatabase();
      Alert.alert(
        'Success',
        `Found ${musicFiles.length} music file(s)! Files have been added to your library.`
      );
    } catch (error) {
      console.error('Error in scanSelectedFiles:', error);
      Alert.alert('Error', 'Failed to process music files. Please try again.');
    }
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

    Alert.alert('Delete Track', `Are you sure you want to delete "${track.title}"?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTrackNow(track),
      },
    ]);
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

  const handlePlaylistPress = useCallback((playlistId: string) => {
    setSelectedPlaylistId(playlistId);
  }, []);

  const handleSidebarNavigationChange = useCallback((view: string) => {
    if (view.startsWith('playlist:')) {
      setSidebarView('playlists');
      return;
    }
    setSidebarView(view);
  }, []);

  const handleClearLibrary = async () => {
    console.log('handleClearLibrary called');
    // Web Alert has only one button, so use confirm dialog instead
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm(
              'Are you sure you want to delete ALL tracks from your library? This cannot be undone.'
            )
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

  const handleClearAllPlaylists = async () => {
    console.log('handleClearAllPlaylists called');
    // Web Alert has only one button, so use confirm dialog instead
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('Are you sure you want to delete ALL playlists? This cannot be undone.')
          : true;
      if (!confirmed) return;
      try {
        await clearAllPlaylistsService();
        Alert.alert('Success', 'All playlists cleared successfully');
      } catch (error) {
        console.error('Error clearing playlists:', error);
        Alert.alert('Error', 'Failed to clear playlists');
      }
      return;
    }

    Alert.alert(
      'Clear All Playlists',
      'Are you sure you want to delete ALL playlists? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllPlaylistsService();
              Alert.alert('Success', 'All playlists cleared successfully');
            } catch (error) {
              console.error('Error clearing playlists:', error);
              Alert.alert('Error', 'Failed to clear playlists');
            }
          },
        },
      ]
    );
  };

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
    return <ArtistsScreen onBack={() => setCurrentView('library')} />;
  }

  if (currentView === 'albums') {
    return <AlbumsScreen onBack={() => setCurrentView('library')} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      {/* Desktop-style Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: tokens.colors.surface,
            borderBottomColor: tokens.colors.background,
          },
        ]}>
        <View style={styles.headerCenter}>
          <StarlightLogo />
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              setShowGearMenu(true);
            }}
            {...(Platform.OS === 'web' && {
              onHoverIn: () => setIsOptionsHovered(true),
              onHoverOut: () => setIsOptionsHovered(false),
            })}
            accessibilityLabel="Settings"
          >
            <Settings 
              size={18} 
              color={isOptionsHovered ? tokens.colors.text : tokens.colors.iconMuted} 
            />
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Sidebar */}
        <View style={{ width: sidebarWidth }}>
          <SidebarNavigation
            onViewChange={handleSidebarNavigationChange}
            currentView={sidebarView}
            onSearchChange={setSearchText}
            onPlaylistSelect={handlePlaylistPress}
            onTrackPlay={(track) => playTrack(track)}
          />
        </View>

        {/* Draggable Divider */}
        <PanGestureHandler
          onGestureEvent={(event) => {
            const newWidth = sidebarWidth + event.nativeEvent.translationX;
            if (newWidth > 200 && newWidth < 1000) {
              setSidebarWidth(newWidth);
            }
          }}>
          <View style={[styles.divider, { backgroundColor: tokens.colors.background }]} />
        </PanGestureHandler>

        {/* Content Area */}
        <View style={[styles.contentArea, { backgroundColor: tokens.colors.background }]}>
          {sidebarView === 'library' ? (
            tracks.length > 0 ? (
              <TableView
                tracks={filteredTracks.map((track) => ({
                  id: track.id,
                  title: track.title,
                  artist: track.artist,
                  album: track.album,
                  durationMs: track.durationMs,
                  genre: 'Dubstep', // Mock genre for now
                  bpm: 140, // Mock BPM for now
                  tags: trackTags[track.id] || [], // Get stored tags for this track
                }))}
                onTrackPress={(track) => playTrack(tracks.find((t) => t.id === track.id)!)}
                onTrackDelete={(track) => handleDeleteTrack(tracks.find((t) => t.id === track.id)!)}
                onTrackAddToPlaylist={(track) =>
                  handleAddToPlaylist(tracks.find((t) => t.id === track.id)!)
                }
                onTrackShowPlaylists={(track) => {
                  // TODO: Implement show playlists functionality
                  console.log('Show playlists for track:', track.title);
                }}
                onTrackTag={(track) => {
                  const actualTrack = tracks.find((t) => t.id === track.id);
                  if (actualTrack) {
                    setSelectedTrackForTagging(actualTrack);
                    setShowTagManager(true);
                  }
                }}
                onBulkDelete={(tracks) => {
                  console.log(
                    'Bulk delete tracks:',
                    tracks.map((t) => t.title)
                  );
                  // TODO: Implement bulk delete functionality
                }}
                onBulkAddToPlaylist={(tracks) => {
                  console.log(
                    'Bulk add to playlist tracks:',
                    tracks.map((t) => t.title)
                  );
                  // TODO: Implement bulk add to playlist functionality
                }}
              />
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyStateIcon, { backgroundColor: tokens.colors.surface }]}>
                  <IconSymbol name="music.note.list" size={48} color={tokens.colors.subtleText} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: tokens.colors.text }]}>
                  Your Music Lives Here
                </Text>
                <Text style={[styles.emptyStateSubtitle, { color: tokens.colors.subtleText }]}>
                  Add your favorite songs and albums to get started
                </Text>
                <Button onPress={handlePickMusicFolders} className="px-8">
                  Add Music
                </Button>
              </View>
            )
          ) : sidebarView === "artists" ? (
            <ArtistsScreen onBack={() => setSidebarView("library")} />
          ) : sidebarView === "albums" ? (
            <AlbumsScreen onBack={() => setSidebarView("library")} />
          ) : sidebarView === "playlists" ? (
            <PlaylistsScreen onPlaylistPress={handlePlaylistPress} />
          ) : sidebarView === 'spotify-playlists' ? (
            <SpotifyPlaylistImportScreen onBack={() => setSidebarView('library')} />
          ) : sidebarView === 'genres' ? (
            <View style={styles.placeholderView}>
              <Text style={[styles.placeholderText, { color: tokens.colors.text }]}>
                Genres view coming soon...
              </Text>
            </View>
          ) : (
            <View style={styles.placeholderView}>
              <Text style={[styles.placeholderText, { color: tokens.colors.text }]}>
                {sidebarView} view coming soon...
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Drag Overlay */}
      <DragOverlay />

      {/* Mini Player */}
      {activeTrack && (
        <MiniPlayer
          onPress={() => {}}
          onTagTrack={() => {
            setSelectedTrackForTagging(activeTrack);
            setShowTagManager(true);
          }}
        />
      )}

      {/* Playlist Creation Modal */}
      <PlaylistCreationModal
        visible={showPlaylistCreation}
        onClose={() => {
          setShowPlaylistCreation(false);
          // If we came from the Add to Playlist modal, return to it
          if (selectedTrack) {
            setShowAddToPlaylist(true);
          }
        }}
        onPlaylistCreated={() => {
          hydratePlaylistsFromDatabase();
          // If we came from the Add to Playlist modal, return to it
          if (selectedTrack) {
            setShowPlaylistCreation(false);
            setShowAddToPlaylist(true);
          }
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
          setShowPlaylistCreation(true);
        }}
      />

      {/* Tag Manager Modal */}
      <TagManager
        visible={showTagManager}
        onClose={() => {
          setShowTagManager(false);
          setSelectedTrackForTagging(null);
        }}
        trackId={selectedTrackForTagging?.id}
        currentTags={selectedTrackForTagging ? trackTags[selectedTrackForTagging.id] || [] : []}
        onTagsUpdate={async (tags) => {
          if (selectedTrackForTagging) {
            try {
              await saveTrackTags(selectedTrackForTagging.id, tags);
              setTrackTags((prev) => ({
                ...prev,
                [selectedTrackForTagging.id]: tags,
              }));
              console.log('Tags updated for track:', selectedTrackForTagging.id, tags);
            } catch (error) {
              console.error('Error saving tags:', error);
            }
          }
        }}
      />

      {/* Gear Menu Modal */}
      <Modal
        visible={showGearMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGearMenu(false)}>
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.1)' }]}
          onPress={() => setShowGearMenu(false)}>
          <View
            style={[
              styles.modalMenu,
              {
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
              },
            ]}>
            <Pressable
              style={[styles.menuItem, { borderBottomColor: tokens.colors.background }]}
              onPress={() => {
                setShowGearMenu(false);
                setShowAddMusicMenu(true);
              }}
            >
              <View className="flex-row items-center">
                <View className="w-5 items-center mr-3">
                  <IconSymbol
                    name="plus"
                    size={16}
                    color={tokens.colors.text}
                  />
                </View>
                <Text className="text-foreground text-sm font-medium">
                  Add Music
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={[styles.menuItem, { borderBottomColor: tokens.colors.background }]}
              onPress={() => {
                setShowGearMenu(false);
                handleClearLibrary();
              }}>
              <View className="flex-row items-center">
                <View className="mr-3 w-5 items-center">
                  <IconSymbol name="trash" size={16} color={tokens.colors.danger} />
                </View>
                <Text className="text-sm font-medium text-destructive">Delete All Songs</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                setShowGearMenu(false);
                handleClearAllPlaylists();
              }}>
              <View className="flex-row items-center">
                <View className="mr-3 w-5 items-center">
                  <IconSymbol name="trash" size={16} color={tokens.colors.danger} />
                </View>
                <Text className="text-sm font-medium text-destructive">Delete All Playlists</Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Add Music Menu Modal */}
      <Modal
        visible={showAddMusicMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMusicMenu(false)}>
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.1)' }]}
          onPress={() => setShowAddMusicMenu(false)}>
          <View
            style={[
              styles.modalMenu,
              {
                backgroundColor: tokens.colors.surface,
                borderColor: tokens.colors.border,
              },
            ]}>
            <Pressable
              style={[styles.menuItem, { borderBottomColor: tokens.colors.background }]}
              onPress={() => {
                setShowAddMusicMenu(false);
                handlePickFolder();
              }}>
              <View className="flex-row items-center">
                <View className="mr-3 w-5 items-center">
                  <IconSymbol name="folder" size={16} color={tokens.colors.text} />
                </View>
                <Text className="text-sm font-medium text-foreground">
                  {Platform.OS === 'web' ? 'Select Music Folder' : 'Select Music Files'}
                </Text>
              </View>
            </Pressable>
            {Platform.OS === 'web' && (
              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setShowAddMusicMenu(false);
                  handlePickFiles();
                }}>
                <View className="flex-row items-center">
                  <View className="mr-3 w-5 items-center">
                    <IconSymbol name="music.note" size={16} color={tokens.colors.text} />
                  </View>
                  <Text className="text-sm font-medium text-foreground">
                    Select Individual Files
                  </Text>
                </View>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  divider: {
    width: 4,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyStateIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  placeholderView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 200,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
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
