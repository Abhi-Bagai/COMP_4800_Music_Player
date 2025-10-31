import Slider from '@react-native-community/slider';
import React, { useMemo } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
} from 'react-native';

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Text } from "@/src/components/ui/text";
import { seekTo, setVolume, skipNext, skipPrevious, togglePlayPause } from "@/src/services/playback-service";
import { usePlayerStore } from "@/src/state";
import { useTheme } from "@/src/theme/provider";

const { width: screenWidth } = Dimensions.get('window');

export default function NowPlayingScreen() {
  const { activeTrack, isPlaying, positionMs, volume } = usePlayerStore();
  const { tokens } = useTheme();

  const handlePlayPause = async () => {
    await togglePlayPause();
  };

  const handleSeek = async (rawValue: number | number[]) => {
    const duration = activeTrack?.durationMs ?? 0;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    const percent = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(percent)) return;

    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    const seekPosition = (clampedPercent / 100) * duration;
    if (!Number.isFinite(seekPosition)) return;

    await seekTo(seekPosition);
  };

  const handleVolumeChange = async (value: number) => {
    const percent = Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
    await setVolume(percent / 100);
  };

  const formatTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (() => {
    const duration = activeTrack?.durationMs ?? 0;
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    const pct = (positionMs / duration) * 100;
    if (!Number.isFinite(pct)) return 0;
    return Math.min(Math.max(pct, 0), 100);
  })();

  const artworkSize = useMemo(() => {
    // Responsive artwork size for sidebar context
    const base = Math.min(screenWidth * 0.4, 300);
    return Math.max(base, 200);
  }, []);

  if (!activeTrack) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <View style={[styles.emptyCard, { backgroundColor: tokens.colors.surface }]}>
          <View
            style={[
              styles.artworkPlaceholder,
              { backgroundColor: tokens.colors.surfaceElevated },
            ]}
          >
            <IconSymbol
              name="music.note"
              color={tokens.colors.subtleText}
              size={64}
            />
          </View>
          <Text variant="subtitle" weight="bold" style={styles.emptyTitle}>
            No track playing
          </Text>
          <Text tone="subtle" style={styles.emptySubtitle}>
            Select a track to begin playback
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <View style={[styles.card, { backgroundColor: tokens.colors.surface }]}>
        {/* Album Artwork */}
        <View style={styles.artworkContainer}>
          <View
            style={[
              styles.artwork,
              { 
                backgroundColor: tokens.colors.surfaceElevated, 
                width: artworkSize, 
                height: artworkSize 
              },
            ]}
          >
            <View style={[styles.artworkInner, { backgroundColor: tokens.colors.primary }]}>
              <IconSymbol name="music.note" size={80} color={tokens.colors.onPrimary} />
            </View>
          </View>
        </View>

        {/* Track Info */}
        <View style={styles.trackInfo}>
          <Text style={[styles.trackTitle, { color: tokens.colors.text }]} numberOfLines={2}>
            {activeTrack.title}
          </Text>
          <Text style={[styles.artistName, { color: tokens.colors.subtleText }]} numberOfLines={1}>
            {activeTrack.artist?.name ?? 'Unknown Artist'}
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Slider
            style={styles.progressBar}
            minimumValue={0}
            maximumValue={100}
            value={progressPercentage}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor={tokens.colors.primary}
            maximumTrackTintColor={tokens.colors.surfaceElevated}
            thumbTintColor={tokens.colors.primary}
          />
          <View style={styles.timeLabels}>
            <Text style={[styles.timeText, { color: tokens.colors.subtleText }]}>
              {formatTime(positionMs)}
            </Text>
            <Text style={[styles.timeText, { color: tokens.colors.subtleText }]}>
              {formatTime(activeTrack.durationMs || 0)}
            </Text>
          </View>
        </View>

        {/* Playback Controls */}
        <View style={styles.controls}>
          <IconButton
            icon={<IconSymbol name="shuffle" size={20} color={tokens.colors.subtleText} />}
            onPress={() => {}}
            accessibilityLabel="Shuffle"
          />

          <IconButton
            icon={<IconSymbol name="backward.fill" size={24} color={tokens.colors.text} />}
            onPress={skipPrevious}
            accessibilityLabel="Previous track"
          />

          <Button
            size="lg"
            variant="primary"
            style={[styles.playButton, { backgroundColor: tokens.colors.primary }]}
            onPress={handlePlayPause}
          >
            <IconSymbol
              name={isPlaying ? 'pause.fill' : 'play.fill'}
              size={24}
              color={tokens.colors.onPrimary}
              style={!isPlaying && { marginLeft: 2 }}
            />
          </Button>

          <IconButton
            icon={<IconSymbol name="forward.fill" size={24} color={tokens.colors.text} />}
            onPress={skipNext}
            accessibilityLabel="Next track"
          />

          <IconButton
            icon={<IconSymbol name="repeat" size={20} color={tokens.colors.subtleText} />}
            onPress={() => {}}
            accessibilityLabel="Repeat"
          />
        </View>

        {/* Volume Control */}
        <View style={styles.volumeContainer}>
          <IconSymbol name="speaker.fill" size={16} color={tokens.colors.subtleText} />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={100}
            value={volume * 100}
            onSlidingComplete={handleVolumeChange}
            minimumTrackTintColor={tokens.colors.primary}
            maximumTrackTintColor={tokens.colors.surfaceElevated}
            thumbTintColor={tokens.colors.primary}
          />
          <IconSymbol name="speaker.wave.3.fill" size={16} color={tokens.colors.subtleText} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  card: {
    gap: 24,
    padding: 24,
    borderRadius: 12,
  },
  emptyCard: {
    gap: 16,
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
  },
  emptyTitle: {
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  
  // Artwork
  artworkContainer: {
    alignItems: 'center',
  },
  artwork: {
    borderRadius: 16,
    padding: 4,
  },
  artworkInner: {
    flex: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Track Info
  trackInfo: {
    alignItems: 'center',
  },
  trackTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Progress
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Volume
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
});

