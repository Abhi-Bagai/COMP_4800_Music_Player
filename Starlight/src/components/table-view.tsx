import React from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
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
}

interface TableHeaderProps {
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
}

function TableHeader({ onSort, sortColumn, sortDirection }: TableHeaderProps) {
  const { tokens } = useTheme();

  const columns = [
    { key: "number", label: "#", width: 40 },
    { key: "source", label: "Source", width: 60 },
    { key: "title", label: "Title", width: 200 },
    { key: "time", label: "Time", width: 60 },
    { key: "artist", label: "Artist", width: 150 },
    { key: "album", label: "Album", width: 150 },
    { key: "bpm", label: "BPM", width: 60 },
    { key: "genre", label: "Genre", width: 100 },
    { key: "tags", label: "Tags", width: 200 },
  ];

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: tokens.colors.surfaceElevated },
      ]}
    >
      {columns.map((column) => (
        <Pressable
          key={column.key}
          style={[styles.headerCell, { width: column.width }]}
          onPress={() => onSort?.(column.key)}
        >
          <Text style={[styles.headerText, { color: tokens.colors.text }]}>
            {column.label}
          </Text>
          {sortColumn === column.key && (
            <IconSymbol
              name={sortDirection === "asc" ? "chevron.up" : "chevron.down"}
              size={12}
              color={tokens.colors.primary}
            />
          )}
        </Pressable>
      ))}
    </View>
  );
}

interface TableRowProps {
  track: Track;
  index: number;
  onPress: (track: Track) => void;
  onDelete?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
}

function TableRow({
  track,
  index,
  onPress,
  onDelete,
  onAddToPlaylist,
}: TableRowProps) {
  const { tokens } = useTheme();

  const getSourceIcon = () => {
    // You can customize this based on track source
    return (
      <IconSymbol name="music.note" size={16} color={tokens.colors.primary} />
    );
  };

  const formatDuration = (durationMs?: number) => {
    if (!durationMs) return "0:00";
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed
            ? tokens.colors.surfaceElevated
            : "transparent",
        },
      ]}
      onPress={() => onPress(track)}
    >
      {/* Number */}
      <View style={[styles.cell, { width: 40 }]}>
        <Text style={[styles.cellText, { color: tokens.colors.subtleText }]}>
          {index + 1}
        </Text>
      </View>

      {/* Source */}
      <View style={[styles.cell, { width: 60, alignItems: "center" }]}>
        {getSourceIcon()}
      </View>

      {/* Title */}
      <View style={[styles.cell, { width: 200 }]}>
        <Text
          style={[styles.cellText, { color: tokens.colors.text }]}
          numberOfLines={1}
        >
          {track.title}
        </Text>
      </View>

      {/* Time */}
      <View style={[styles.cell, { width: 60 }]}>
        <Text style={[styles.cellText, { color: tokens.colors.text }]}>
          {formatDuration(track.durationMs)}
        </Text>
      </View>

      {/* Artist */}
      <View style={[styles.cell, { width: 150 }]}>
        <Text
          style={[styles.cellText, { color: tokens.colors.text }]}
          numberOfLines={1}
        >
          {track.artist?.name ?? "Unknown Artist"}
        </Text>
      </View>

      {/* Album */}
      <View style={[styles.cell, { width: 150 }]}>
        <Text
          style={[styles.cellText, { color: tokens.colors.text }]}
          numberOfLines={1}
        >
          {track.album?.title ?? "Unknown Album"}
        </Text>
      </View>

      {/* BPM */}
      <View style={[styles.cell, { width: 60 }]}>
        <Text style={[styles.cellText, { color: tokens.colors.text }]}>
          {track.bpm ?? "N/A"}
        </Text>
      </View>

      {/* Genre */}
      <View style={[styles.cell, { width: 100 }]}>
        <Text
          style={[styles.cellText, { color: tokens.colors.text }]}
          numberOfLines={1}
        >
          {track.genre ?? "Unknown"}
        </Text>
      </View>

      {/* Tags */}
      <View
        style={[
          styles.cell,
          { width: 200, flexDirection: "row", flexWrap: "wrap", gap: 4 },
        ]}
      >
        {track.tags?.slice(0, 3).map((tag, tagIndex) => (
          <View
            key={tagIndex}
            style={[
              styles.tag,
              { backgroundColor: tokens.colors.surfaceElevated },
            ]}
          >
            <Text style={[styles.tagText, { color: tokens.colors.subtleText }]}>
              {tag}
            </Text>
          </View>
        ))}
        {track.tags && track.tags.length > 3 && (
          <Text style={[styles.tagText, { color: tokens.colors.subtleText }]}>
            +{track.tags.length - 3}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export function TableView({
  tracks,
  onTrackPress,
  onTrackDelete,
  onTrackAddToPlaylist,
}: TableViewProps) {
  const { tokens } = useTheme();
  const [sortColumn, setSortColumn] = React.useState<string>("time");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">(
    "desc"
  );

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
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
          />
        )}
        style={styles.list}
        showsVerticalScrollIndicator={false}
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
  headerCell: {
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
});
