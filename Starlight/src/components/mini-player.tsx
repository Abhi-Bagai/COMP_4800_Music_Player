import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/src/components/ui/text';
import { skipNext, skipPrevious, togglePlayPause } from '@/src/services/playback-service';
import { usePlayerStore } from '@/src/state';
import { useTheme } from '@/src/theme/provider';

interface MiniPlayerProps {
  onPress: () => void;
}

export function MiniPlayer({ onPress }: MiniPlayerProps) {
  const { tokens } = useTheme();
  const { activeTrack, isPlaying, positionMs } = usePlayerStore();

  if (!activeTrack) return null;

  const handlePlayPause = async (e: any) => {
    e.stopPropagation();
    await togglePlayPause();
  };

  const progressPercentage = (() => {
    const duration = activeTrack.durationMs ?? 0;
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    const pct = (positionMs / duration) * 100;
    if (!Number.isFinite(pct)) return 0;
    return Math.min(Math.max(pct, 0), 100);
  })();

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.surfaceElevated }]}>
      {/* Progress Bar */}
      <View
        style={[
          styles.progressBar,
          {
            width: `${progressPercentage}%`,
            backgroundColor: tokens.colors.primary,
          },
        ]}
      />

      <Pressable style={styles.content} onPress={onPress}>
        {/* Album Art */}
        <View style={[styles.albumArt, { backgroundColor: tokens.colors.primary }]}>
          <IconSymbol name="music.note" size={16} color={tokens.colors.onPrimary} />
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text
            style={[styles.trackTitle, { color: tokens.colors.onSurface }]}
            numberOfLines={1}
          >
            {activeTrack.title}
          </Text>
          <Text
            style={[styles.artistName, { color: tokens.colors.subtle }]}
            numberOfLines={1}
          >
            {activeTrack.artist?.name ?? 'Unknown Artist'}
          </Text>
        </View>

        {/* Transport Controls */}
        <View style={styles.transport}>
          <Pressable style={styles.iconButton} onPress={(e) => { e.stopPropagation(); skipPrevious(); }}>
            <IconSymbol name="backward.fill" size={18} color={tokens.colors.onSurface} />
          </Pressable>
          <Pressable style={styles.playButton} onPress={handlePlayPause}>
            <IconSymbol
              name={isPlaying ? "pause.fill" : "play.fill"}
              size={20}
              color={tokens.colors.onSurface}
            />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={(e) => { e.stopPropagation(); skipNext(); }}>
            <IconSymbol name="forward.fill" size={18} color={tokens.colors.onSurface} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  progressBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 2,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  albumArt: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackInfo: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  artistName: {
    fontSize: 12,
  },
  playButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});