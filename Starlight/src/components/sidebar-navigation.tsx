import React, { useState, useEffect, useMemo } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/src/components/ui/text';
import { useTrackDropTarget } from '@/src/hooks/use-track-dnd';
import { useTheme } from '@/src/theme/provider';
import { usePlaylistStore } from '@/src/state/playlist-store';
import { addTrackToPlaylistById } from '@/src/services/playlist-service';

interface SidebarNavigationProps {
  onViewChange: (view: string) => void;
  currentView: string;
  onSearchChange?: (searchText: string) => void;
  onPlaylistPress?: (playlistId: string) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  children?: NavigationItem[];
}

interface NavigationItemRowProps {
  item: NavigationItem;
  level: number;
  currentView: string;
  expandedItems: string[];
  toggleExpanded: (id: string) => void;
  onViewChange: (view: string) => void;
  onPlaylistPress?: (playlistId: string) => void;
  tokens: ReturnType<typeof useTheme>["tokens"];
}

function NavigationItemRow({
  item,
  level,
  currentView,
  expandedItems,
  toggleExpanded,
  onViewChange,
  onPlaylistPress,
  tokens,
}: NavigationItemRowProps) {
  const hasChildren = Boolean(item.children?.length);
  const isExpanded = expandedItems.includes(item.id);
  const isSelected = currentView === item.id;
  const isPlaylistChild = item.id.startsWith('playlist-');
  const playlistId = isPlaylistChild ? item.id.replace('playlist-', '') : null;

  const dropTarget = useTrackDropTarget({
    targetId: playlistId,
    isEnabled: isPlaylistChild,
    onDropTrack: async (track) => {
      if (!playlistId) return;

      try {
        await addTrackToPlaylistById(playlistId, track.id);
        if (Platform.OS === 'web') {
          alert(`Added "${track.title}" to playlist`);
        } else {
          Alert.alert('Success', `Added "${track.title}" to playlist`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to add track to playlist';
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    },
  });

  const draggedTrack = dropTarget.draggedTrack;
  const isHovered = dropTarget.isHovered && !!draggedTrack;

  const handlePress = async () => {
    if (hasChildren) {
      toggleExpanded(item.id);
      return;
    }

    if (isPlaylistChild) {
      if (draggedTrack) {
        await dropTarget.handleDrop();
        return;
      }

      onPlaylistPress?.(playlistId!);
      return;
    }

    onViewChange(item.id);
  };

  const webDropHandlers =
    Platform.OS === 'web' && isPlaylistChild ? dropTarget.webDropHandlers : undefined;
  const pressableDropHandlers = (webDropHandlers ?? {}) as Record<string, any>;

  return (
    <View>
      <Pressable
        style={({ pressed }) => [
          styles.navItem,
          {
            backgroundColor:
              isHovered
                ? tokens.colors.primary + '20'
                : isSelected
                  ? tokens.colors.surfaceElevated
                  : pressed
                    ? tokens.colors.surfaceElevated
                    : 'transparent',
            paddingLeft: 16 + level * 16,
            borderWidth: isHovered ? 2 : 0,
            borderColor: isHovered ? tokens.colors.primary : 'transparent',
          },
        ]}
        onPress={handlePress}
        {...pressableDropHandlers}>
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
                color: isSelected ? tokens.colors.primary : tokens.colors.text,
              },
            ]}>
            {item.label}
          </Text>
          {hasChildren && (
            <IconSymbol
              name={isExpanded ? 'chevron.up' : 'chevron.down'}
              size={12}
              color={isSelected ? tokens.colors.primary : tokens.colors.subtleText}
            />
          )}
        </View>
      </Pressable>

      {hasChildren && isExpanded && (
        <View style={styles.childrenContainer}>
          {item.children?.map((child) => (
            <NavigationItemRow
              key={child.id}
              item={child}
              level={level + 1}
              currentView={currentView}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              onViewChange={onViewChange}
              onPlaylistPress={onPlaylistPress}
              tokens={tokens}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function SidebarNavigation({
  onViewChange,
  currentView,
  onSearchChange,
  onPlaylistPress,
}: SidebarNavigationProps) {
  const { tokens } = useTheme();
  const { playlists } = usePlaylistStore();
  const [expandedItems, setExpandedItems] = useState<string[]>(['library']);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    onSearchChange?.(searchText);
  }, [searchText, onSearchChange]);

  const navigationItems = useMemo<NavigationItem[]>(() => {
    return [
      {
        id: 'library',
        label: 'Library',
        icon: 'music.note.list',
      },
      {
        id: 'now-playing',
        label: 'Now Playing',
        icon: 'play.fill',
      },
      {
        id: 'artists',
        label: 'Artists',
        icon: 'mic',
      },
      {
        id: 'albums',
        label: 'Albums',
        icon: 'opticaldisc',
      },
      {
        id: 'playlists',
        label: 'Playlists',
        icon: 'music.note.list',
        children: playlists.map((playlist) => ({
          id: `playlist-${playlist.id}`,
          label: playlist.name,
          icon: 'music.note',
        })),
      },
      {
        id: 'genres',
        label: 'Genres',
        icon: 'pianokeys',
      },
    ];
  }, [playlists]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.surface }]}>
      <View style={[styles.searchContainer, { backgroundColor: tokens.colors.surfaceElevated }]}>
        <IconSymbol name="magnifyingglass" size={16} color={tokens.colors.subtleText} />
        <TextInput
          style={[styles.searchInput, { color: tokens.colors.text }]}
          placeholder="Search library..."
          placeholderTextColor={tokens.colors.subtleText}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView style={styles.navigationContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.navigationContent}>
          {navigationItems.map((item) => (
            <NavigationItemRow
              key={item.id}
              item={item}
              level={0}
              currentView={currentView}
              expandedItems={expandedItems}
              toggleExpanded={toggleExpanded}
              onViewChange={onViewChange}
              onPlaylistPress={onPlaylistPress}
              tokens={tokens}
            />
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  navItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  childrenContainer: {
    marginLeft: 8,
  },
});
