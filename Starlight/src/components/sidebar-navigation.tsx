import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Button } from "@/src/components/ui/button";
import { Text } from "@/src/components/ui/text";
import { useTheme } from "@/src/theme/provider";

interface SidebarNavigationProps {
  onViewChange: (view: string) => void;
  currentView: string;
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
}: SidebarNavigationProps) {
  const { tokens } = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "library",
  ]);
  const [searchText, setSearchText] = useState("");

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const isSelected = currentView === item.id;
    const hasChildren = item.children && item.children.length > 0;

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
            if (hasChildren) {
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
            {item.children?.map((child) => (
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
