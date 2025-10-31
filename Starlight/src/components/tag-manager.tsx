import React, { useState } from "react";
import { Pressable, StyleSheet, View, Modal, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Button } from "@/src/components/ui/button";
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
  const styles = getStyles(tokens);

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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <StatusBar style="light" />

      {Platform.OS === 'ios' ? (
        <BlurView intensity={100} tint="dark" style={styles.container}>
          <Content
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onSave={handleSave}
            onCancel={handleCancel}
            tokens={tokens}
            styles={styles}
          />
        </BlurView>
      ) : (
        <View style={[styles.container, styles.androidContainer]}>
          <Content
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onSave={handleSave}
            onCancel={handleCancel}
            tokens={tokens}
            styles={styles}
          />
        </View>
      )}
    </Modal>
  );
}

interface ContentProps {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onSave: () => void;
  onCancel: () => void;
  tokens: any;
  styles: any;
}

function Content({
  selectedTags,
  onTagToggle,
  onSave,
  onCancel,
  tokens,
  styles,
}: ContentProps) {
  return (
    <>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Manage Tags</Text>
        <Pressable onPress={onCancel} style={styles.closeButton}>
          <IconSymbol
            name="xmark"
            size={24}
            color={tokens.colors.subtleText}
          />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
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
              onPress={() => onTagToggle(tag)}
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
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button variant="secondary" onPress={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onPress={onSave}>
          Save Tags
        </Button>
      </View>
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
    content: {
      flex: 1,
      padding: 20,
    },
    tagGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      gap: 6,
    },
    tagText: {
      fontSize: 14,
      fontWeight: '500',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: tokens.colors.border,
      gap: 12,
    },
  });
}

