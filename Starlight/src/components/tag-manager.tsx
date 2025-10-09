import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Button } from "@/src/components/ui/button";
import { Surface } from "@/src/components/ui/surface";
import { Text } from "@/src/components/ui/text";
import { useTheme } from "@/src/theme/provider";

interface TagManagerProps {
  visible: boolean;
  onClose: () => void;
  trackId?: string;
  currentTags?: string[];
  onTagsUpdate?: (tags: string[]) => void;
}

const availableTags = [
  "Banger",
  "Dancefloor Destroyers",
  "Epic Climax",
  "Heavy Artillery",
  "Bumpin'",
  "Chill",
  "Dark",
  "Dope",
  "Headline",
  "Peak-time",
  "Warm-up",
  "Breakdown",
  "Build-up",
  "Drop",
  "Vocal",
  "Instrumental",
];

export function TagManager({
  visible,
  onClose,
  trackId,
  currentTags = [],
  onTagsUpdate,
}: TagManagerProps) {
  const { tokens } = useTheme();
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);

  if (!visible) return null;

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    onTagsUpdate?.(selectedTags);
    onClose();
  };

  const handleCancel = () => {
    setSelectedTags(currentTags);
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Surface variant="elevated" padding="lg" style={styles.modal}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>
            Manage Tags
          </Text>
          <Pressable onPress={handleCancel}>
            <IconSymbol
              name="xmark"
              size={24}
              color={tokens.colors.subtleText}
            />
          </Pressable>
        </View>

        <View style={styles.tagGrid}>
          {availableTags.map((tag) => (
            <Pressable
              key={tag}
              style={[
                styles.tagButton,
                {
                  backgroundColor: selectedTags.includes(tag)
                    ? tokens.colors.primary
                    : tokens.colors.surfaceElevated,
                  borderColor: selectedTags.includes(tag)
                    ? tokens.colors.primary
                    : tokens.colors.border,
                },
              ]}
              onPress={() => handleTagToggle(tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color: selectedTags.includes(tag)
                      ? tokens.colors.onPrimary
                      : tokens.colors.text,
                  },
                ]}
              >
                {tag}
              </Text>
              {selectedTags.includes(tag) && (
                <IconSymbol
                  name="checkmark"
                  size={16}
                  color={tokens.colors.onPrimary}
                />
              )}
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          <Button variant="ghost" onPress={handleCancel}>
            Cancel
          </Button>
          <Button variant="primary" onPress={handleSave}>
            Save Tags
          </Button>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    width: "80%",
    maxWidth: 400,
    maxHeight: "70%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  tagButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
});
