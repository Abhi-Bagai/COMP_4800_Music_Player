import React from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  Modal,
  Platform,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { IconButton } from "@/src/components/ui/icon-button";
import { Text } from "@/src/components/ui/text";
import { useTheme } from "@/src/theme/provider";

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
        { backgroundColor: tokens.colors.surfaceElevated },
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
                  style={[styles.headerText, { color: tokens.colors.text }]}
                >
                  {column.label}
                </Text>
                {sortColumn === column.key && (
                  <IconSymbol
                    name={
                      sortDirection === "asc" ? "chevron.up" : "chevron.down"
                    }
                    size={12}
                    color={tokens.colors.primary}
                  />
                )}
              </Pressable>
            )}
            {index < columns.length - 1 && (
              <>
                <View
                  style={[
                    styles.columnDivider,
                    { backgroundColor: tokens.colors.border },
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
                      { backgroundColor: tokens.colors.border },
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
  onAddToPlaylist: (track: Track) => void;
  onDelete: (track: Track) => void;
  onShowPlaylists: (track: Track) => void;
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
  onAddToPlaylist,
  onDelete,
  onShowPlaylists,
  onBulkDelete,
  onBulkAddToPlaylist,
}: ContextMenuProps) {
  const { tokens } = useTheme();

  if (!visible) return null;

  const hasMultipleSelected = selectedTracks.length > 1;
  const currentTrack = track || selectedTracks[0];

  const menuItems = [
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
            },
          ]}
        >
          {menuItems.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.contextMenuItem,
                index < menuItems.length - 1 && {
                  borderBottomColor: tokens.colors.border,
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
  const [isHovered, setIsHovered] = React.useState(false);

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
    // For web, we'll use onPress with a modifier key check
    // For mobile, we'll use onLongPress
    const { pageX, pageY } = event.nativeEvent;
    onContextMenu(track, { x: pageX, y: pageY });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed
            ? tokens.colors.surfaceElevated
            : isHovered
            ? tokens.colors.surfaceElevated
            : "transparent",
        },
      ]}
      onPress={() => onPress(track)}
      onLongPress={handleLongPress}
      delayLongPress={500}
      onHoverIn={Platform.OS === "web" ? () => setIsHovered(true) : undefined}
      onHoverOut={Platform.OS === "web" ? () => setIsHovered(false) : undefined}
    >
      {columns.map((column, columnIndex) => {
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
              <Text style={[styles.cellText, { color: tokens.colors.text }]}>
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
              <Text style={[styles.cellText, { color: tokens.colors.text }]}>
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
              <>
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
                  >
                    +{track.tags.length - 3}
                  </Text>
                )}
              </>
            );
            break;
          case "actions":
            content = onDelete ? (
              <IconButton
                size="sm"
                tone="danger"
                icon={
                  <IconSymbol
                    name="trash"
                    size={16}
                    color={tokens.colors.danger}
                  />
                }
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete(track);
                }}
                accessibilityLabel={`Delete ${track.title}`}
              />
            ) : null;
            break;
          default:
            content = null;
        }

        return (
          <View key={column.key} style={styles.cellContainer}>
            <View
              style={[
                styles.cell,
                { width: column.width },
                column.key === "source" || column.key === "actions"
                  ? { alignItems: "center" }
                  : {},
                column.key === "tags"
                  ? { flexDirection: "row", flexWrap: "wrap", gap: 4 }
                  : {},
              ]}
            >
              {content}
            </View>
            {columnIndex < columns.length - 1 && (
              <View
                style={[
                  styles.columnDivider,
                  { backgroundColor: tokens.colors.border },
                ]}
              />
            )}
          </View>
        );
      })}
    </Pressable>
  );
}

export function TableView({
  tracks,
  onTrackPress,
  onTrackDelete,
  onTrackAddToPlaylist,
  onTrackShowPlaylists,
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
    { key: "actions", label: "", width: 60 },
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

  return (
    <View
      style={[styles.container, { backgroundColor: tokens.colors.background }]}
    >
      <TableHeader
        onSort={handleSort}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        columns={columns}
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
            columns={columns}
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
        onAddToPlaylist={(track) => onTrackAddToPlaylist?.(track)}
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
  },
  header: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
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
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  columnDivider: {
    width: 1,
    height: "100%",
  },
  resizeHandle: {
    width: 8,
    height: "100%",
    cursor: "pointer" as any,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "500",
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
