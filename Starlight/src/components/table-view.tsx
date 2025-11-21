import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { PanGestureHandler, LongPressGestureHandler, State } from "react-native-gesture-handler";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { IconButton } from "@/src/components/ui/icon-button";
import { Text } from "@/src/components/ui/text";
import { useTheme } from "@/src/theme/provider";
import { usePlayerStore } from "@/src/state";
import { useDrag } from "@/src/contexts/drag-context";
import { addTrackToPlaylistById, hydratePlaylistsFromDatabase, isTrackInPlaylist } from "@/src/services/playlist-service";

interface Track {
  id: string;
  title: string;
  artist?: { name: string } | null;
  album?: { title: string } | null;
  durationMs?: number | null;
  genre?: string;
  bpm?: number;
  tags?: string[];
}

interface TableViewProps {
  tracks: Track[];
  onTrackPress: (track: Track) => void;
  onTrackDelete?: (track: Track) => void;
  onTrackAddToPlaylist?: (track: Track) => void;
  onTrackShowPlaylists?: (track: Track) => void;
  onTrackTag?: (track: Track) => void;
  onBulkDelete?: (tracks: Track[]) => void;
  onBulkAddToPlaylist?: (tracks: Track[]) => void;
}

interface ColumnConfig {
  key: string;
  label: string;
  width: number;
}

interface TableHeaderProps {
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  columns: ColumnConfig[];
  onColumnResize: (columnKey: string, newWidth: number) => void;
  selectedTracks: Set<string>;
  allTracks: Track[];
  onSelectAll: () => void;
}

function TableHeader({
  onSort,
  sortColumn,
  sortDirection,
  columns,
  onColumnResize,
  selectedTracks,
  allTracks,
  onSelectAll,
}: TableHeaderProps) {
  const { tokens } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: tokens.colors.surface,
          borderBottomColor: tokens.colors.background,
        },
      ]}
    >
      {columns.map((column, index) => {
        const isAllSelected =
          selectedTracks.size === allTracks.length && allTracks.length > 0;
        const isIndeterminate =
          selectedTracks.size > 0 && selectedTracks.size < allTracks.length;

        return (
          <View key={column.key} style={styles.headerCellContainer}>
            {column.key === "select" ? (
              <Pressable
                style={[styles.headerCell, { width: column.width }]}
                onPress={onSelectAll}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    {
                      backgroundColor: isAllSelected
                        ? tokens.colors.primary
                        : "transparent",
                      borderColor: tokens.colors.border,
                    },
                  ]}
                >
                  {isAllSelected && (
                    <IconSymbol
                      name="checkmark"
                      size={12}
                      color={tokens.colors.onPrimary}
                    />
                  )}
                  {isIndeterminate && (
                    <View
                      style={[
                        styles.checkboxIndeterminate,
                        { backgroundColor: tokens.colors.primary },
                      ]}
                    />
                  )}
                </View>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.headerCell, { width: column.width }]}
                onPress={() => onSort?.(column.key)}
              >
                <Text
                  style={[styles.headerText, { color: tokens.colors.subtleText }]}
                >
                  {column.label}
                </Text>
                {sortColumn === column.key && (
                  <IconSymbol
                    name={
                      sortDirection === "asc" ? "chevron.up" : "chevron.down"
                    }
                    size={12}
                    color={tokens.colors.subtleText}
                  />
                )}
              </Pressable>
            )}
            {index < columns.length - 1 && (
              <>
                <View
                  style={[
                    styles.columnDivider,
                    { backgroundColor: 'transparent' },
                  ]}
                />
                <PanGestureHandler
                  onGestureEvent={(event) => {
                    const newWidth = Math.max(
                      40,
                      column.width + event.nativeEvent.translationX
                    );
                    onColumnResize(column.key, newWidth);
                  }}
                >
                  <View
                    style={[
                      styles.resizeHandle,
                      { backgroundColor: 'transparent' },
                    ]}
                  />
                </PanGestureHandler>
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  track: Track | null;
  selectedTracks: Track[];
  onClose: () => void;
  onPlay: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
  onDelete: (track: Track) => void;
  onShowPlaylists: (track: Track) => void;
  onTagTrack: (track: Track) => void;
  onBulkDelete: (tracks: Track[]) => void;
  onBulkAddToPlaylist: (tracks: Track[]) => void;
}

interface TableRowProps {
  track: Track;
  index: number;
  onPress: (track: Track) => void;
  onDelete?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onShowPlaylists?: (track: Track) => void;
  columns: ColumnConfig[];
  onContextMenu: (track: Track, position: { x: number; y: number }) => void;
  isSelected: boolean;
  onToggleSelect: (track: Track) => void;
}

function ContextMenu({
  visible,
  position,
  track,
  selectedTracks,
  onClose,
  onPlay,
  onAddToPlaylist,
  onDelete,
  onShowPlaylists,
  onTagTrack,
  onBulkDelete,
  onBulkAddToPlaylist,
}: ContextMenuProps) {
  const { tokens } = useTheme();

  if (!visible) return null;

  const hasMultipleSelected = selectedTracks.length > 1;
  const currentTrack = track || selectedTracks[0];

  const menuItems = [
    {
      label: "Play",
      icon: "play.fill",
      onPress: () => {
        onPlay(currentTrack);
        onClose();
      },
      disabled: hasMultipleSelected,
    },
    {
      label: hasMultipleSelected
        ? `Add ${selectedTracks.length} tracks to Playlists`
        : "Add to Playlists",
      icon: "plus.circle",
      onPress: () => {
        if (hasMultipleSelected) {
          onBulkAddToPlaylist(selectedTracks);
        } else {
          onAddToPlaylist(currentTrack);
        }
        onClose();
      },
    },
    {
      label: "Tag Track",
      icon: "tag",
      onPress: () => {
        onTagTrack(currentTrack);
        onClose();
      },
      disabled: hasMultipleSelected,
    },
    {
      label: "Show Playlists",
      icon: "list.bullet",
      onPress: () => {
        onShowPlaylists(currentTrack);
        onClose();
      },
      disabled: hasMultipleSelected,
    },
    {
      label: hasMultipleSelected
        ? `Delete ${selectedTracks.length} tracks`
        : "Delete",
      icon: "trash",
      onPress: () => {
        if (hasMultipleSelected) {
          onBulkDelete(selectedTracks);
        } else {
          onDelete(currentTrack);
        }
        onClose();
      },
      destructive: true,
    },
  ].filter((item) => !item.disabled);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.contextMenuBackdrop} onPress={onClose}>
        <View
          style={[
            styles.contextMenu,
            {
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.border,
              left: position.x,
              top: position.y,
              shadowColor: tokens.colors.shadow,
              shadowOffset: tokens.shadow.offset,
              shadowOpacity: tokens.shadow.opacity,
              shadowRadius: tokens.shadow.radius,
              elevation: tokens.shadow.elevation,
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.contextMenuItem,
                index < menuItems.length - 1 && {
                  borderBottomColor: tokens.colors.background,
                  borderBottomWidth: 1,
                },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.contextMenuItemContent}>
                <IconSymbol
                  name={item.icon as any}
                  size={16}
                  color={
                    item.destructive ? tokens.colors.danger : tokens.colors.text
                  }
                />
                <Text
                  style={[
                    styles.contextMenuItemText,
                    {
                      color: item.destructive
                        ? tokens.colors.danger
                        : tokens.colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

function TableRow({
  track,
  index,
  onPress,
  onDelete,
  onAddToPlaylist,
  onShowPlaylists,
  columns,
  onContextMenu,
  isSelected,
  onToggleSelect,
}: TableRowProps) {
  const { tokens } = useTheme();
  const { activeTrack, isPlaying } = usePlayerStore();
  /**
   * Global drag-and-drop wiring shared with the Now Playing sheet and sidebar.  Each
   * row contributes pointer updates so the overlay can be rendered centrally.
   */
  const {
    setDraggedTrack,
    setDragPosition,
    hoveredPlaylistId,
    setHoveredPlaylistId,
    lastHoveredPlaylistId,
    resetLastHoveredPlaylistId,
  } = useDrag();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const rowRef = React.useRef<View>(null);
  const dropProcessingRef = React.useRef(false);
  const isDraggingRef = React.useRef(false);

  React.useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Check if this track is currently playing
  const isCurrentlyPlaying = activeTrack?.id === track.id && isPlaying;

  const getSourceIcon = () => {
    // You can customize this based on track source
    return (
      <IconSymbol name="music.note" size={16} color={tokens.colors.primary} />
    );
  };

  const formatDuration = (durationMs?: number | null) => {
    if (!durationMs) return "0:00";
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const getColumnWidth = (key: string) => {
    return columns.find((col) => col.key === key)?.width ?? 60;
  };

  const handleLongPress = (event: any) => {
    // For mobile, we'll use onLongPress
    const { pageX, pageY } = event.nativeEvent;
    onContextMenu(track, { x: pageX, y: pageY });
  };

  const handlePress = (event: any) => {
    // Regular left-click
    onPress(track);
  };

  const handleContextMenu = (event: any) => {
    // Handle right-click context menu on web
    if (Platform.OS === "web") {
      event.preventDefault();
      const { pageX, pageY } = event.nativeEvent;
      onContextMenu(track, { x: pageX, y: pageY });
    }
  };

  /**
   * Begin a drag originating from the library table.  We immediately publish the track
   * metadata so the overlay can mirror it on every screen.
   */
  const handleDragStart = React.useCallback(
    (event: any) => {
      const { pageX, pageY } = event.nativeEvent;
      setIsDragging(true);
      console.log('[TableRow] drag start', track.id, pageX, pageY);
      setDraggedTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
      });
      setDragPosition({ x: pageX, y: pageY });
    },
    [setDragPosition, setDraggedTrack, track.artist, track.id, track.title]
  );

  /**
   * Push the global pointer position so the DragOverlay can follow the cursor/finger.
   */
  const handleDragUpdate = React.useCallback(
    (event: any) => {
      const { pageX, pageY } = event.nativeEvent;
      console.log('[TableRow] drag move', track.id, pageX, pageY);
      setDragPosition({ x: pageX, y: pageY });
    },
    [setDragPosition, track.id]
  );

  /**
   * Finish the drag.  We snapshot the target playlist before clearing the global drag
   * state so the async playlist mutation can run without keeping the UI blocked.
   */
  const handleDragEnd = React.useCallback(() => {
    if (!isDragging) return;

    const targetPlaylistId = hoveredPlaylistId ?? lastHoveredPlaylistId;
    const trackId = track.id;
    const trackTitle = track.title;

    setIsDragging(false);
    setDraggedTrack(null);
    setDragPosition(null);
    setHoveredPlaylistId(null);
    resetLastHoveredPlaylistId();
    console.log('[TableRow] drag end', track.id, 'target', targetPlaylistId);

    if (!targetPlaylistId) {
      return;
    }

    if (dropProcessingRef.current) {
      return;
    }

    dropProcessingRef.current = true;
    (async () => {
      try {
        const alreadyInPlaylist = await isTrackInPlaylist(targetPlaylistId, trackId);
        if (alreadyInPlaylist) {
          if (Platform.OS === "web") {
            window.alert?.("This track is already in the playlist");
          }
          return;
        }

        await addTrackToPlaylistById(targetPlaylistId, trackId);

        // addTrackToPlaylistById already hydrates playlists, but ensure UI stays up-to-date.
        await hydratePlaylistsFromDatabase();

        if (Platform.OS === "web") {
          window.alert?.(`Added "${trackTitle}" to playlist`);
        }
      } catch (error) {
        console.error("Failed to add track from Library drag-and-drop", error);
        if (Platform.OS === "web") {
          window.alert?.("Failed to add track to playlist");
        }
      } finally {
        dropProcessingRef.current = false;
        console.log('[TableRow] drop finished');
      }
    })();
  }, [
    hoveredPlaylistId,
    isDragging,
    lastHoveredPlaylistId,
    resetLastHoveredPlaylistId,
    setDragPosition,
    setDraggedTrack,
    setHoveredPlaylistId,
    track.id,
    track.title,
  ]);

  const rowContent = (
    <Pressable
        style={[
        styles.row,
        {
          backgroundColor: isCurrentlyPlaying
            ? tokens.colors.primaryMutedBg // Semi-transparent primary color for currently playing
            : isDragging
            ? tokens.colors.primaryMutedBg
            : isPressed 
            ? tokens.colors.surfaceElevated 
            : isHovered 
            ? tokens.colors.surfaceElevated 
            : tokens.colors.surface,
          borderBottomColor: tokens.colors.background,
          opacity: isDragging ? tokens.opacity.dragging : 1,
        },
      ]}
      onPress={isDragging ? undefined : handlePress}
      onLongPress={isDragging ? undefined : handleLongPress}
      delayLongPress={500}
      onPressIn={() => !isDragging && setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      onHoverIn={Platform.OS === "web" && !isDragging ? () => setIsHovered(true) : undefined}
      onHoverOut={Platform.OS === "web" ? () => setIsHovered(false) : undefined}
      // Handle right-click context menu on web
      {...(Platform.OS === "web" && {
        onContextMenu: handleContextMenu,
        onMouseMove: isDragging
          ? (event: React.MouseEvent<View, MouseEvent>) =>
              handleDragUpdate({ nativeEvent: event.nativeEvent })
          : undefined,
      })}
      {...(Platform.OS !== "web" && {
        onTouchMove: isDragging
          ? (event: any) => handleDragUpdate(event)
          : undefined,
      })}
    >
      {columns.map((column: ColumnConfig, columnIndex: number) => {
        let content;

        switch (column.key) {
          case "select":
            content = (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onToggleSelect(track);
                }}
                style={styles.checkbox}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    {
                      backgroundColor: isSelected
                        ? tokens.colors.primary
                        : "transparent",
                      borderColor: tokens.colors.border,
                    },
                  ]}
                >
                  {isSelected && (
                    <IconSymbol
                      name="checkmark"
                      size={12}
                      color={tokens.colors.onPrimary}
                    />
                  )}
                </View>
              </Pressable>
            );
            break;
          case "number":
            content = (
              <Text
                style={[styles.cellText, { color: tokens.colors.subtleText }]}
              >
                {index + 1}
              </Text>
            );
            break;
          case "source":
            content = getSourceIcon();
            break;
          case "title":
            content = (
              <Text
                style={[styles.cellText, { color: tokens.colors.text }]}
                numberOfLines={1}
              >
                {track.title}
              </Text>
            );
            break;
          case "time":
            content = (
              <Text 
                style={[styles.cellText, { color: tokens.colors.subtleText }]}
                numberOfLines={1}
              >
                {formatDuration(track.durationMs)}
              </Text>
            );
            break;
          case "artist":
            content = (
              <Text
                style={[styles.cellText, { color: tokens.colors.text }]}
                numberOfLines={1}
              >
                {track.artist?.name ?? "Unknown Artist"}
              </Text>
            );
            break;
          case "album":
            content = (
              <Text
                style={[styles.cellText, { color: tokens.colors.text }]}
                numberOfLines={1}
              >
                {track.album?.title ?? "Unknown Album"}
              </Text>
            );
            break;
          case "bpm":
            content = (
              <Text 
                style={[styles.cellText, { color: tokens.colors.subtleText }]}
                numberOfLines={1}
              >
                {track.bpm ?? "N/A"}
              </Text>
            );
            break;
          case "genre":
            content = (
              <Text
                style={[styles.cellText, { color: tokens.colors.text }]}
                numberOfLines={1}
              >
                {track.genre ?? "Unknown"}
              </Text>
            );
            break;
          case "tags":
            content = (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ alignItems: 'center', gap: 4 }}
              >
                {track.tags?.slice(0, 3).map((tag, tagIndex) => (
                  <View
                    key={tagIndex}
                    style={[
                      styles.tag,
                      { backgroundColor: tokens.colors.surfaceElevated },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        { color: tokens.colors.subtleText },
                      ]}
                      numberOfLines={1}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
                {track.tags && track.tags.length > 3 && (
                  <Text
                    style={[
                      styles.tagText,
                      { color: tokens.colors.subtleText },
                    ]}
                    numberOfLines={1}
                  >
                    +{track.tags.length - 3}
                  </Text>
                )}
              </ScrollView>
            );
            break;
          default:
            content = null;
        }

        return (
          <View key={column.key} style={styles.cellContainer}>
            <View
              style={[
                styles.cell,
                { width: column.width + 1 },
                column.key === "source"
                  ? { alignItems: "center" }
                  : {},
                column.key === "tags"
                  ? { flexDirection: "row", gap: 4 }
                  : {},
              ]}
            >
              {content}
            </View>
            {columnIndex < columns.length - 1 && (
              <View
                style={[
                  styles.columnDivider,
                  { backgroundColor: 'transparent' },
                ]}
              />
            )}
          </View>
        );
      })}
    </Pressable>
  );

  // Set up web drag handlers
  React.useEffect(() => {
    if (Platform.OS !== "web" || typeof document === 'undefined') return;

    const rowElement = rowRef.current;
    if (!rowElement) return;

    // For web, attach mouse event listeners directly to the DOM element
    const handleMouseDown = (e: MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;
      
      const startX = e.pageX;
      const startY = e.pageY;
      let isDraggingNow = false;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = Math.abs(moveEvent.pageX - startX);
        const deltaY = Math.abs(moveEvent.pageY - startY);
        
        // Start dragging after 5px movement
        if ((deltaX > 5 || deltaY > 5) && !isDraggingNow) {
          isDraggingNow = true;
          handleDragStart({ nativeEvent: { pageX: moveEvent.pageX, pageY: moveEvent.pageY } });
        }
        
        if (isDraggingNow) {
          handleDragUpdate({ nativeEvent: { pageX: moveEvent.pageX, pageY: moveEvent.pageY } });
        }
      };

      const handleMouseUp = () => {
        if (isDraggingNow) {
          handleDragEnd();
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    // Use type assertion to access DOM element on web
    const domNode = rowElement as any;
    if (domNode && domNode.addEventListener) {
      domNode.addEventListener('mousedown', handleMouseDown);
      return () => {
        domNode.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [track.id, handleDragEnd, handleDragStart, handleDragUpdate]);

  /**
   * Web-only: install a global mouseup listener so a drop that finishes outside the row
   * (e.g. on top of the sidebar) still triggers cleanup.
   */
  React.useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const handleGlobalMouseUp = () => {
      if (!isDraggingRef.current) return;
      handleDragEnd();
    };

    window.addEventListener("mouseup", handleGlobalMouseUp, true);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp, true);
    };
  }, [handleDragEnd]);

  // Wrap with gesture handlers for drag functionality
  if (Platform.OS === "web") {
    // For web, use ref-based approach
    return (
      <View ref={rowRef}>
        {rowContent}
      </View>
    );
  }

  // For mobile, use LongPressGestureHandler + PanGestureHandler
  return (
    <LongPressGestureHandler
      minDurationMs={300}
      onHandlerStateChange={(event) => {
        if (event.nativeEvent.state === State.ACTIVE) {
          handleDragStart(event);
        }
      }}
    >
      <PanGestureHandler
        onGestureEvent={handleDragUpdate}
        onHandlerStateChange={(event) => {
          if (event.nativeEvent.state === State.END || event.nativeEvent.state === State.CANCELLED) {
            handleDragEnd();
          }
        }}
        enabled={isDragging}
      >
        {rowContent}
      </PanGestureHandler>
    </LongPressGestureHandler>
  );
}

export function TableView({
  tracks,
  onTrackPress,
  onTrackDelete,
  onTrackAddToPlaylist,
  onTrackShowPlaylists,
  onTrackTag,
  onBulkDelete,
  onBulkAddToPlaylist,
}: TableViewProps) {
  const { tokens } = useTheme();
  const [sortColumn, setSortColumn] = React.useState<string>("time");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc"
  );
  const [columns, setColumns] = React.useState<ColumnConfig[]>([
    { key: "select", label: "", width: 40 },
    { key: "number", label: "#", width: 40 },
    { key: "source", label: "Source", width: 60 },
    { key: "title", label: "Title", width: 200 },
    { key: "time", label: "Time", width: 60 },
    { key: "artist", label: "Artist", width: 150 },
    { key: "album", label: "Album", width: 150 },
    { key: "bpm", label: "BPM", width: 60 },
    { key: "genre", label: "Genre", width: 100 },
    { key: "tags", label: "Tags", width: 200 },
  ]);
  const [selectedTracks, setSelectedTracks] = React.useState<Set<string>>(
    new Set()
  );
  const [contextMenu, setContextMenu] = React.useState<{
    visible: boolean;
    position: { x: number; y: number };
    track: Track | null;
  }>({
    visible: false,
    position: { x: 0, y: 0 },
    track: null,
  });

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleColumnResize = (columnKey: string, newWidth: number) => {
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.key === columnKey ? { ...col, width: newWidth } : col
      )
    );
  };

  const handleContextMenu = (
    track: Track,
    position: { x: number; y: number }
  ) => {
    setContextMenu({
      visible: true,
      position,
      track,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      position: { x: 0, y: 0 },
      track: null,
    });
  };

  const handleToggleSelect = (track: Track) => {
    setSelectedTracks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(track.id)) {
        newSet.delete(track.id);
      } else {
        newSet.add(track.id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTracks.size === tracks.length) {
      setSelectedTracks(new Set());
    } else {
      setSelectedTracks(new Set(tracks.map((track) => track.id)));
    }
  };

  const getSelectedTracksArray = () => {
    return tracks.filter((track) => selectedTracks.has(track.id));
  };

  const sortedTracks = React.useMemo(() => {
    return [...tracks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case "title":
          aValue = a.title?.toLowerCase() ?? "";
          bValue = b.title?.toLowerCase() ?? "";
          break;
        case "artist":
          aValue = a.artist?.name?.toLowerCase() ?? "";
          bValue = b.artist?.name?.toLowerCase() ?? "";
          break;
        case "album":
          aValue = a.album?.title?.toLowerCase() ?? "";
          bValue = b.album?.title?.toLowerCase() ?? "";
          break;
        case "time":
          aValue = a.durationMs ?? 0;
          bValue = b.durationMs ?? 0;
          break;
        case "bpm":
          aValue = a.bpm ?? 0;
          bValue = b.bpm ?? 0;
          break;
        case "genre":
          aValue = a.genre?.toLowerCase() ?? "";
          bValue = b.genre?.toLowerCase() ?? "";
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [tracks, sortColumn, sortDirection]);

  // Filter out the "select" column from visible columns
  const visibleColumns = React.useMemo(() => {
    return columns.filter((col) => col.key !== "select");
  }, [columns]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: tokens.colors.background }
      ]}
    >
      <TableHeader
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        columns={visibleColumns}
        onColumnResize={handleColumnResize}
        selectedTracks={selectedTracks}
        allTracks={tracks}
        onSelectAll={handleSelectAll}
      />
      <FlatList
        data={sortedTracks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <TableRow
            track={item}
            index={index}
            onPress={onTrackPress}
            onDelete={onTrackDelete}
            onAddToPlaylist={onTrackAddToPlaylist}
            onShowPlaylists={onTrackShowPlaylists}
            columns={visibleColumns}
            onContextMenu={handleContextMenu}
            isSelected={selectedTracks.has(item.id)}
            onToggleSelect={handleToggleSelect}
          />
        )}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu.visible}
        position={contextMenu.position}
        track={contextMenu.track}
        selectedTracks={getSelectedTracksArray()}
        onClose={closeContextMenu}
        onPlay={(track) => onTrackPress(track)}
        onAddToPlaylist={(track) => onTrackAddToPlaylist?.(track)}
        onTagTrack={(track) => onTrackTag?.(track)}
        onDelete={(track) => onTrackDelete?.(track)}
        onShowPlaylists={(track) => onTrackShowPlaylists?.(track)}
        onBulkDelete={(tracks) => onBulkDelete?.(tracks)}
        onBulkAddToPlaylist={(tracks) => onBulkAddToPlaylist?.(tracks)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderBottomWidth: 0,
  },
  headerCellContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cellContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerCell: {
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  columnDivider: {
    width: 1,
    height: "100%",
  },
  resizeHandle: {
    width: 1,
    height: "100%",
    cursor: "pointer" as any,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "400",
    textTransform: "capitalize",
    letterSpacing: 0.5,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  cell: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 14,
    fontWeight: "400",
  },
  tag: {
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 10,
    includeFontPadding: false,
    marginVertical: -4,
  },
  // Context Menu Styles
  contextMenuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  contextMenu: {
    position: "absolute",
    minWidth: 180,
    borderRadius: 8,
    borderWidth: 1,
  },
  contextMenuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  contextMenuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contextMenuItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Checkbox Styles
  checkbox: {
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxIndeterminate: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
});
