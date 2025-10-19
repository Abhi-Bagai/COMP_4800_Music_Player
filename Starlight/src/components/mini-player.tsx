import Slider from '@react-native-community/slider';
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Button } from "@/src/components/ui/button";
import { Text } from "@/src/components/ui/text";
import {
  skipNext,
  skipPrevious,
  togglePlayPause,
  setVolume,
} from "@/src/services/playback-service";
import { usePlayerStore } from "@/src/state";
import { useTheme } from "@/src/theme/provider";

interface MiniPlayerProps {
  onPress: () => void;
  onTagTrack?: () => void;
}

export function MiniPlayer({ onPress, onTagTrack }: MiniPlayerProps) {
  const { tokens } = useTheme();
  const { activeTrack, isPlaying, positionMs, volume } = usePlayerStore();

  if (!activeTrack) return null;

  const handlePlayPause = async (e: any) => {
    e.stopPropagation();
    await togglePlayPause();
  };

  const handleVolumeChange = async (value: number) => {
    const percent = Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0;
    await setVolume(percent / 100);
  };

  const progressPercentage = (() => {
    const duration = activeTrack.durationMs ?? 0;
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    const pct = (positionMs / duration) * 100;
    if (!Number.isFinite(pct)) return 0;
    return Math.min(Math.max(pct, 0), 100);
  })();

  const formatTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms < 0) return "0:00";
    const total = Math.floor(ms / 1000);
    const minutes = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (total % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const remaining = Math.max((activeTrack.durationMs ?? 0) - positionMs, 0);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: tokens.colors.surfaceElevated },
      ]}
    >
      <View style={styles.content}>
        {/* Left Side - Track Info */}
        <View style={styles.leftSection}>
          <Text style={[styles.trackTitle, { color: tokens.colors.text }]}>
            {activeTrack.title}
          </Text>
          <Text
            style={[styles.artistAlbum, { color: tokens.colors.subtleText }]}
          >
            {activeTrack.artist?.name ?? "Unknown Artist"} —{" "}
            {activeTrack.album?.title ?? "Unknown Album"}
          </Text>
          <Button
            size="sm"
            variant="primary"
            style={[
              styles.tagButton,
              { backgroundColor: tokens.colors.primary },
            ]}
            onPress={onTagTrack}
          >
            <Text
              style={{
                color: tokens.colors.onPrimary,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              Tag Track
            </Text>
          </Button>
        </View>

        {/* Center - Progress and Controls */}
        <View style={styles.centerSection}>
          <View style={styles.progressContainer}>
            <Text
              style={[styles.timeText, { color: tokens.colors.subtleText }]}
            >
              {formatTime(positionMs)}
            </Text>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: tokens.colors.surface },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: tokens.colors.primary,
                  },
                ]}
              />
            </View>
            <Text
              style={[styles.timeText, { color: tokens.colors.subtleText }]}
            >
              -{formatTime(remaining)}
            </Text>
          </View>

          <View style={styles.controls}>
            <Pressable
              style={styles.controlButton}
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <IconSymbol
                name="shuffle"
                size={16}
                color={tokens.colors.primary}
              />
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={(e) => {
                e.stopPropagation();
                skipPrevious();
              }}
            >
              <IconSymbol
                name="backward.fill"
                size={16}
                color={tokens.colors.text}
              />
            </Pressable>
            <Pressable style={styles.playButton} onPress={handlePlayPause}>
              <IconSymbol
                name={isPlaying ? "pause.fill" : "play.fill"}
                size={20}
                color={tokens.colors.text}
              />
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={(e) => {
                e.stopPropagation();
                skipNext();
              }}
            >
              <IconSymbol
                name="forward.fill"
                size={16}
                color={tokens.colors.text}
              />
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <IconSymbol name="repeat" size={16} color={tokens.colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Right Side - Volume */}
        <View style={styles.rightSection}>
          <IconSymbol
            name="speaker.wave.2"
            size={16}
            color={tokens.colors.text}
          />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={100}
            value={volume * 100}
            onSlidingComplete={handleVolumeChange}
            minimumTrackTintColor={tokens.colors.primary}
            maximumTrackTintColor={tokens.colors.surface}
            thumbTintColor={tokens.colors.primary}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 20,
  },
  leftSection: {
    width: 280,
    gap: 4,
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  artistAlbum: {
    fontSize: 12,
    fontWeight: "400",
  },
  tagButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "400",
    minWidth: 32,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  controlButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  rightSection: {
    width: 120,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volumeSlider: {
    flex: 1,
    height: 20,
  },
});
