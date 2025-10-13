import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { PanGestureHandler, Swipeable } from "react-native-gesture-handler";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { AddToPlaylistModal } from "@/src/components/add-to-playlist-modal";
import { AlbumsScreen } from "@/src/components/albums-screen";
import { ArtistsScreen } from "@/src/components/artists-screen";
import { FolderPicker } from "@/src/components/folder-picker";
import { MiniPlayer } from "@/src/components/mini-player";
import { NowPlaying } from "@/src/components/now-playing";
import { PlaylistCreationModal } from "@/src/components/playlist-creation-modal";
import { PlaylistDetailScreen } from "@/src/components/playlist-detail-screen";
import { SidebarNavigation } from "@/src/components/sidebar-navigation";
import { TableView } from "@/src/components/table-view";
import { TagManager } from "@/src/components/tag-manager";
import { Button } from "@/src/components/ui/button";
import { DropdownMenu } from "@/src/components/ui/dropdown-menu";
import { IconButton } from "@/src/components/ui/icon-button";
import { Text } from "@/src/components/ui/text";
import { StarlightLogo } from "@/src/components/starlight-logo";
import {
  clearLibrary,
  deleteTrack,
  hydrateLibraryFromDatabase,
} from "@/src/services/library-service";
import { playTrack } from "@/src/services/playback-service";
import { hydratePlaylistsFromDatabase, clearAllPlaylistsService } from "@/src/services/playlist-service";
import { useLibraryStore, usePlayerStore, usePlaylistStore } from "@/src/state";
import { useTheme } from "@/src/theme/provider";

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
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [currentView, setCurrentView] = useState<
    "library" | "artists" | "albums"
  >("library");
  const [sidebarView, setSidebarView] = useState<string>("library");
  const [showTagManager, setShowTagManager] = useState(false);
  const [selectedTrackForTagging, setSelectedTrackForTagging] =
    useState<any>(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showGearMenu, setShowGearMenu] = useState(false);

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
    console.error("Scan error:", error);
  };

  const handleDeleteTrack = (track: any) => {
    console.log("Delete button pressed for track:", track.title);

    if (Platform.OS === "web") {
      // Use browser confirm for web
      const confirmed = window.confirm(
        `Are you sure you want to delete "${track.title}"?`
      );
      if (confirmed) {
        deleteTrackNow(track);
      }
      return;
    }

    Alert.alert(
      "Delete Track",
      `Are you sure you want to delete "${track.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTrackNow(track),
        },
      ]
    );
  };

  const deleteTrackNow = async (track: any) => {
    try {
      console.log("Deleting track:", track.id);
      await deleteTrack(track.id);
      console.log("Track deleted successfully");
    } catch (error) {
      console.error("Error deleting track:", error);
      Alert.alert("Error", "Failed to delete track");
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
    console.log('handleClearLibrary called');
    // Web Alert has only one button, so use confirm dialog instead
    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined" && typeof window.confirm === "function"
          ? window.confirm(
              "Are you sure you want to delete ALL tracks from your library? This cannot be undone."
            )
          : true;
      if (!confirmed) return;
      try {
        // Clear UI immediately, then clear DB and rehydrate
        useLibraryStore.getState().setTracks([]);
        await clearLibrary();
        Alert.alert("Success", "Library cleared successfully");
      } catch (error) {
        console.error("Error clearing library:", error);
        Alert.alert("Error", "Failed to clear library");
      }
      return;
    }

    Alert.alert(
      "Clear Library",
      "Are you sure you want to delete ALL tracks from your library? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              useLibraryStore.getState().setTracks([]);
              await clearLibrary();
              Alert.alert("Success", "Library cleared successfully");
            } catch (error) {
              console.error("Error clearing library:", error);
              Alert.alert("Error", "Failed to clear library");
            }
          },
        },
      ]
    );
  };

  const handleClearAllPlaylists = async () => {
    console.log('handleClearAllPlaylists called');
    // Web Alert has only one button, so use confirm dialog instead
    if (Platform.OS === "web") {
      const confirmed =
        typeof window !== "undefined" && typeof window.confirm === "function"
          ? window.confirm(
              "Are you sure you want to delete ALL playlists? This cannot be undone."
            )
          : true;
      if (!confirmed) return;
      try {
        await clearAllPlaylistsService();
        Alert.alert("Success", "All playlists cleared successfully");
      } catch (error) {
        console.error("Error clearing playlists:", error);
        Alert.alert("Error", "Failed to clear playlists");
      }
      return;
    }

    Alert.alert(
      "Clear All Playlists",
      "Are you sure you want to delete ALL playlists? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllPlaylistsService();
              Alert.alert("Success", "All playlists cleared successfully");
            } catch (error) {
              console.error("Error clearing playlists:", error);
              Alert.alert("Error", "Failed to clear playlists");
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

  if (currentView === "artists") {
    return <ArtistsScreen onBack={() => setCurrentView("library")} />;
  }

  if (currentView === "albums") {
    return <AlbumsScreen onBack={() => setCurrentView("library")} />;
  }

  return (
    <View
      style={[
        styles.screenContainer,
        { backgroundColor: tokens.colors.background },
      ]}
    >
      {/* Desktop-style Header */}
      <View
        style={[
          styles.desktopHeader,
          { backgroundColor: tokens.colors.surface },
        ]}
      >
        <View style={styles.headerContent}>
          <StarlightLogo 
            width={130} 
            height={25} 
            color={tokens.colors.primary} 
          />
          <View style={styles.headerActions}>
            <Button
              size="sm"
              variant="primary"
              style={[
                styles.addMusicButton,
                { backgroundColor: tokens.colors.primary },
              ]}
              onPress={handlePickMusicFolders}
            >
              <IconSymbol
                name="plus"
                size={16}
                color={tokens.colors.onPrimary}
              />
              <Text
                style={{
                  color: tokens.colors.onPrimary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Add Music
              </Text>
            </Button>
            <IconButton
              icon={
                <IconSymbol name="gear" size={24} color={tokens.colors.text} />
              }
              accessibilityLabel="Settings"
              onPress={() => {
                setShowGearMenu(true);
              }}
            />
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        {/* Sidebar */}
        <View style={[styles.sidebar, { width: sidebarWidth }]}>
          <SidebarNavigation
            onViewChange={setSidebarView}
            currentView={sidebarView}
          />
        </View>

        {/* Draggable Divider */}
        <PanGestureHandler
          onGestureEvent={(event) => {
            const newWidth = sidebarWidth + event.nativeEvent.translationX;
            if (newWidth > 200 && newWidth < 1000) {
              setSidebarWidth(newWidth);
            }
          }}
        >
          <View
            style={[styles.divider, { backgroundColor: tokens.colors.border }]}
          />
        </PanGestureHandler>

        {/* Content Area */}
        <View
          style={[
            styles.contentArea,
            { backgroundColor: tokens.colors.background },
          ]}
        >
          {sidebarView === "library" ? (
            tracks.length > 0 ? (
              <TableView
                tracks={tracks.map((track) => ({
                  id: track.id,
                  title: track.title,
                  artist: track.artist,
                  album: track.album,
                  durationMs: track.durationMs,
                  genre: "Dubstep", // Mock genre for now
                  bpm: 140, // Mock BPM for now
                  tags: ["Banger", "Dancefloor", "Headline", "Peak-time"], // Mock tags for now
                }))}
                onTrackPress={(track) =>
                  playTrack(tracks.find((t) => t.id === track.id)!)
                }
                onTrackDelete={(track) =>
                  handleDeleteTrack(tracks.find((t) => t.id === track.id)!)
                }
                onTrackAddToPlaylist={(track) =>
                  handleAddToPlaylist(tracks.find((t) => t.id === track.id)!)
                }
              />
            ) : (
              <View style={styles.emptyState}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: tokens.colors.surfaceElevated },
                  ]}
                >
                  <IconSymbol
                    name="music.note.list"
                    size={48}
                    color={tokens.colors.subtleText}
                  />
                </View>
                <Text
                  style={[styles.emptyTitle, { color: tokens.colors.text }]}
                >
                  Your Music Lives Here
                </Text>
                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: tokens.colors.subtleText },
                  ]}
                >
                  Add your favorite songs and albums to get started
                </Text>
                <Button
                  onPress={handlePickMusicFolders}
                  style={styles.emptyAction}
                >
                  Add Music
                </Button>
              </View>
            )
          ) : sidebarView === "artists" ? (
            <ArtistsScreen onBack={() => setSidebarView("library")} />
          ) : sidebarView === "albums" ? (
            <AlbumsScreen onBack={() => setSidebarView("library")} />
          ) : sidebarView === "genres" ? (
            <View style={styles.placeholderView}>
              <Text
                style={[styles.placeholderText, { color: tokens.colors.text }]}
              >
                Genres view coming soon...
              </Text>
            </View>
          ) : (
            <View style={styles.placeholderView}>
              <Text
                style={[styles.placeholderText, { color: tokens.colors.text }]}
              >
                {sidebarView} view coming soon...
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Mini Player */}
      {activeTrack && (
        <MiniPlayer
          onPress={() => setShowNowPlaying(true)}
          onTagTrack={() => {
            setSelectedTrackForTagging(activeTrack);
            setShowTagManager(true);
          }}
        />
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

      {/* Tag Manager Modal */}
      <TagManager
        visible={showTagManager}
        onClose={() => {
          setShowTagManager(false);
          setSelectedTrackForTagging(null);
        }}
        trackId={selectedTrackForTagging?.id}
        currentTags={["Banger", "Dancefloor"]} // Mock current tags
        onTagsUpdate={(tags) => {
          console.log("Tags updated:", tags);
          // Here you would update the track's tags in the database
        }}
      />

      {/* Gear Menu Modal */}
      <Modal
        visible={showGearMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGearMenu(false)}
      >
        <Pressable 
          style={styles.gearMenuBackdrop} 
          onPress={() => setShowGearMenu(false)}
        >
          <View style={[styles.gearMenu, { backgroundColor: tokens.colors.surface }]}>
            <Pressable
              style={styles.gearMenuItem}
              onPress={() => {
                setShowGearMenu(false);
                handleClearLibrary();
              }}
            >
              <View style={styles.gearMenuItemContent}>
                <View style={styles.gearMenuItemIcon}>
                  <IconSymbol name="trash" size={16} color={tokens.colors.danger} />
                </View>
                <Text style={[styles.gearMenuItemText, { color: tokens.colors.danger }]}>
                  Delete All Songs
                </Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.gearMenuItem}
              onPress={() => {
                setShowGearMenu(false);
                handleClearAllPlaylists();
              }}
            >
              <View style={styles.gearMenuItemContent}>
                <View style={styles.gearMenuItemIcon}>
                  <IconSymbol name="trash" size={16} color={tokens.colors.danger} />
                </View>
                <Text style={[styles.gearMenuItemText, { color: tokens.colors.danger }]}>
                  Delete All Playlists
                </Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },

  // Desktop Header Styles
  desktopHeader: {
    height: 60,
    paddingHorizontal: 20,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addMusicButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },

  // Main Content Layout
  mainContent: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    // Width is set dynamically via inline style
  },
  divider: {
    width: 20,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  contentArea: {
    flex: 1,
  },

  // Placeholder View
  placeholderView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyAction: {
    paddingHorizontal: 32,
  },

  // Gear Menu Styles
  gearMenuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  gearMenu: {
    position: 'absolute',
    top: 80,
    right: 20,
    width: 200,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  gearMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  gearMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearMenuItemIcon: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  gearMenuItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

function formatTrackDuration(duration?: number | null) {
  if (!duration) return "";
  const totalSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
