import React from 'react';
import { Modal, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useDrag } from '@/src/contexts/drag-context';
import { useTheme } from '@/src/theme/provider';
import { Text } from '@/src/components/ui/text';
import { IconSymbol } from '@/components/ui/icon-symbol';

export function DragOverlay() {
  const { draggedTrack, dragPosition } = useDrag();
  const { tokens } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  React.useEffect(() => {
    if (draggedTrack) {
      scale.value = withSpring(1.1);
      opacity.value = withSpring(0.9);
    } else {
      scale.value = withSpring(1);
      opacity.value = withSpring(1);
    }
  }, [draggedTrack]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!draggedTrack || !dragPosition) {
    return null;
  }

  return (
    <Modal
      visible={true}
      transparent
      animationType="none"
      pointerEvents="none"
    >
      <Animated.View
        style={[
          styles.container,
          {
            left: dragPosition.x - 60,
            top: dragPosition.y - 20,
          },
          animatedStyle,
        ]}
      >
        <View
          style={[
            styles.dragItem,
            {
              backgroundColor: tokens.colors.surface,
              borderColor: tokens.colors.primary,
              shadowColor: tokens.colors.shadow,
              shadowOffset: tokens.shadow.offset,
              shadowOpacity: tokens.shadow.opacity,
              shadowRadius: tokens.shadow.radius,
              elevation: tokens.shadow.elevation,
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: tokens.colors.surfaceElevated }]}>
            <IconSymbol name="music.note" size={20} color={tokens.colors.primary} />
          </View>
          <View style={styles.textContainer}>
            <Text
              style={[styles.trackTitle, { color: tokens.colors.text }]}
              numberOfLines={1}
            >
              {draggedTrack.title}
            </Text>
            <Text
              style={[styles.trackArtist, { color: tokens.colors.subtleText }]}
              numberOfLines={1}
            >
              {draggedTrack.artist?.name ?? 'Unknown Artist'}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10000,
    ...Platform.select({
      web: {
        cursor: 'grabbing',
      },
    }),
  },
  dragItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 200,
    maxWidth: 250,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  trackArtist: {
    fontSize: 12,
  },
});

