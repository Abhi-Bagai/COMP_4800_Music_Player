import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/src/components/ui/text";
import { usePlaylistStore } from "@/src/state/playlist-store";
import { useDrag } from "@/src/contexts/drag-context";
import { useTheme } from "@/src/theme/provider";
import { Platform } from "react-native";

interface SidebarNavigationProps {
  onViewChange: (view: string) => void;
  currentView: string;
  onSearchChange?: (searchText: string) => void;
  onPlaylistSelect?: (playlistId: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    id: "library",
    label: "Library",
    icon: "music.note.list",
  },
  {
    id: "now-playing",
    label: "Now Playing",
    icon: "play.fill",
  },
  {
    id: "artists",
    label: "Artists",
    icon: "mic",
  },
  {
    id: "albums",
    label: "Albums",
    icon: "opticaldisc",
  },
  {
    id: "playlists",
    label: "Playlists",
    icon: "music.note.list",
  },
  {
    id: "genres",
    label: "Genres",
    icon: "pianokeys",
  },
];

export function SidebarNavigation({
  onViewChange,
  currentView,
  onSearchChange,
  onPlaylistSelect,
}: SidebarNavigationProps) {
  const { tokens } = useTheme();
  const { playlists } = usePlaylistStore();
  const { draggedTrack, hoveredPlaylistId } = useDrag();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "library",
    "playlists",
  ]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    onSearchChange?.(searchText);
  }, [searchText, onSearchChange]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handlePlaylistPress = useCallback(
    (playlistId: string) => {
      onPlaylistSelect?.(playlistId);
      onViewChange(`playlist:${playlistId}`);
    },
    [onPlaylistSelect, onViewChange]
  );

  const navigationItemsWithPlaylists = useMemo(() => {
    return navigationItems.map((item) =>
      item.id === "playlists"
        ? {
            ...item,
            children: playlists.map((playlist) => ({
              id: playlist.id,
              label: playlist.name,
              icon: "music.note.list",
            })),
          }
        : item
    );
  }, [playlists]);

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isSelected = currentView === item.id;
    const isPlaylistsNode = item.id === "playlists";
    const children = isPlaylistsNode ? navigationItemsWithPlaylists.find((nav) => nav.id === "playlists")?.children : item.children;
    const hasChildren = !!children && children.length > 0;

    return (
      <View key={item.id}>
        <Pressable
          style={({ pressed }) => [
            styles.navItem,
            {
              backgroundColor: isSelected
                ? tokens.colors.surfaceElevated
                : pressed
                ? tokens.colors.surfaceElevated
                : "transparent",
              paddingLeft: 16 + level * 16,
            },
          ]}
          onPress={() => {
            if (isPlaylistsNode) {
              toggleExpanded(item.id);
              onViewChange(item.id);
            } else if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              onViewChange(item.id);
            }
          }}
        >
          <View style={styles.navItemContent}>
            <IconSymbol
              name={item.icon as any}
              size={16}
              color={isSelected ? tokens.colors.primary : tokens.colors.text}
            />
            <Text
              style={[
                styles.navItemText,
                {
                  color: isSelected
                    ? tokens.colors.primary
                    : tokens.colors.text,
                },
              ]}
            >
              {item.label}
            </Text>
            {hasChildren && (
              <IconSymbol
                name={isExpanded ? "chevron.up" : "chevron.down"}
                size={12}
                color={
                  isSelected
                    ? tokens.colors.primary
                    : tokens.colors.subtleText
                }
              />
            )}
          </View>
        </Pressable>

        {hasChildren && isExpanded && (
          <View style={styles.childrenContainer}>
            {isPlaylistsNode
              ? playlists.map((playlist) => (
                  <SidebarPlaylistNavItem
                    key={playlist.id}
                    playlist={playlist}
                    level={level + 1}
                    tokens={tokens}
                    isDragged={!!draggedTrack}
                    isHovered={hoveredPlaylistId === playlist.id}
                    onPress={handlePlaylistPress}
                  />
                ))
              : item.children?.map((child) => (
                  <View key={child.id}>
                    {renderNavigationItem(child, level + 1)}
                    {child.children && expandedItems.includes(child.id) && (
                      <View style={styles.childrenContainer}>
                        {child.children.map((grandChild) =>
                          renderNavigationItem(grandChild, level + 2)
                        )}
                      </View>
                    )}
                  </View>
                ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: tokens.colors.surface }]}
    >
      {/* Search Bar */}
      <View
        style={[styles.searchContainer, { backgroundColor: tokens.colors.surfaceElevated }]}
      >
        <IconSymbol
          name="magnifyingglass"
          size={16}
          color={tokens.colors.subtleText}
        />
        <TextInput
          style={[styles.searchInput, { color: tokens.colors.text }]}
          placeholder="Search library..."
          placeholderTextColor={tokens.colors.subtleText}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Navigation Items */}
      <ScrollView
        style={styles.navigationContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navigationContent}>
          {navigationItems.map((item) => renderNavigationItem(item))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  navigationContainer: {
    flex: 1,
  },
  navigationContent: {
    paddingHorizontal: 12,
  },
  navItem: {
    borderRadius: 6,
    marginVertical: 1,
  },
  navItemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  navItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  childrenContainer: {
    marginLeft: 8,
  },
});

interface SidebarPlaylistNavItemProps {
  playlist: { id: string; name: string; trackCount: number };
  level: number;
  tokens: any;
  isDragged: boolean;
  isHovered: boolean;
  onPress: (playlistId: string) => void;
}

/**
 * Individual playlist entry inside the sidebar drop-down.  Each item registers its
 * layout with the drag context so the library and now playing overlays can treat the
 * sidebar as a first-class drop target.
 */
function SidebarPlaylistNavItem({
  playlist,
  level,
  tokens,
  isDragged,
  isHovered,
  onPress,
}: SidebarPlaylistNavItemProps) {
  const { registerDropZoneLayout, unregisterDropZoneLayout } = useDrag();
  const containerRef = useRef<View>(null);

  /**
   * Cache the playlist hit-box in global drag state so pointer math can avoid DOM
   * queries on native platforms.
   */
  const updateDropZoneLayout = useCallback(() => {
    const node = containerRef.current as any;
    if (node?.measureInWindow) {
      node.measureInWindow((x: number, y: number, width: number, height: number) => {
        registerDropZoneLayout(playlist.id, { x, y, width, height });
      });
    }
  }, [playlist.id, registerDropZoneLayout]);

  useEffect(() => {
    updateDropZoneLayout();
  }, [updateDropZoneLayout]);

  /**
   * Web needs to recompute when the window resizes because our layout transform changes.
   */
  useEffect(() => {
    if (Platform.OS === "web") {
      const handleResize = () => updateDropZoneLayout();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
    return;
  }, [updateDropZoneLayout]);

  useEffect(
    () => () => {
      unregisterDropZoneLayout(playlist.id);
    },
    [playlist.id, unregisterDropZoneLayout]
  );

  return (
    <View
      ref={containerRef}
      onLayout={updateDropZoneLayout}
      nativeID={Platform.OS === "web" ? `playlist-drop-${playlist.id}` : undefined}
    >
      <Pressable
        style={({ pressed }) => [
          styles.navItem,
          {
            backgroundColor: isHovered && isDragged
              ? tokens.colors.primary + "20"
              : pressed
              ? tokens.colors.surfaceElevated
              : "transparent",
            paddingLeft: 16 + level * 16,
            borderWidth: isHovered && isDragged ? 1 : 0,
            borderColor: isHovered && isDragged ? tokens.colors.primary : "transparent",
          },
        ]}
        onPress={() => onPress(playlist.id)}
      >
        <View style={styles.navItemContent}>
          <IconSymbol
            name="music.note.list"
            size={14}
            color={isHovered && isDragged ? tokens.colors.primary : tokens.colors.subtleText}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.navItemText,
                {
                  color: tokens.colors.text,
                  fontWeight: "500",
                },
              ]}
              numberOfLines={1}
            >
              {playlist.name}
            </Text>
            <Text
              style={{
                color: tokens.colors.subtleText,
                fontSize: 12,
              }}
            >
              {playlist.trackCount} {playlist.trackCount === 1 ? "track" : "tracks"}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
