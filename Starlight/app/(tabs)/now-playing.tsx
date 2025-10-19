import { StyleSheet, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Button } from "@/src/components/ui/button";
import { IconButton } from "@/src/components/ui/icon-button";
import { Surface } from "@/src/components/ui/surface";
import { Text } from "@/src/components/ui/text";
import { togglePlayPause } from "@/src/services/playback-service";
import { usePlayerStore } from "@/src/state";
import { useTheme } from "@/src/theme/provider";

export default function NowPlayingScreen() {
  const { activeTrack, isPlaying, positionMs } = usePlayerStore();
  const { tokens } = useTheme();

  const durationMs = Number.isFinite(activeTrack?.durationMs ?? 0)
    ? activeTrack?.durationMs ?? 0
    : 0;
  const safePosition =
    Number.isFinite(positionMs) && positionMs >= 0 ? positionMs : 0;
  const remaining = Math.max(durationMs - safePosition, 0);

  return (
    <View style={styles.container}>
      <Surface variant="elevated" padding="lg" style={styles.card}>
        <View
          style={[
            styles.artworkPlaceholder,
            { backgroundColor: tokens.colors.primaryMuted },
          ]}
        >
          <IconSymbol
            name="house.fill"
            color={tokens.colors.primary}
            size={64}
          />
        </View>
        <Text variant="subtitle" weight="bold">
          {activeTrack?.title ?? "No track playing"}
        </Text>
        <Text tone="subtle">
          {activeTrack?.artist?.name ?? "Select a track to begin playback"}
        </Text>
        <View style={styles.timeline}>
          <Text variant="caption" tone="subtle">
            {formatTime(safePosition)}
          </Text>
          <View
            style={[
              styles.timelineBar,
              { backgroundColor: tokens.colors.surfaceElevated },
            ]}
          >
            <View
              style={[
                styles.timelineProgress,
                {
                  width: timelineProgressPercent(
                    safePosition,
                    durationMs
                  ) as any,
                  backgroundColor: tokens.colors.primary,
                },
              ]}
            />
          </View>
          <Text variant="caption" tone="subtle">
            -{formatTime(remaining)}
          </Text>
        </View>
        <View style={styles.controls}>
          <IconButton
            icon={
              <IconSymbol
                name="chevron.right"
                size={20}
                color={tokens.colors.primary}
                style={styles.prevIcon}
              />
            }
            accessibilityLabel="Previous track"
            tone="primary"
            onPress={() => {}}
          />
          <Button size="lg" onPress={togglePlayPause}>
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <IconButton
            icon={
              <IconSymbol
                name="chevron.right"
                size={20}
                color={tokens.colors.primary}
              />
            }
            accessibilityLabel="Next track"
            tone="primary"
            onPress={() => {}}
          />
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    gap: 16,
  },
  artworkPlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  timeline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timelineBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  timelineProgress: {
    height: "100%",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  prevIcon: {
    transform: [{ scaleX: -1 }],
  },
});

function formatTime(ms?: number) {
  if (!Number.isFinite(ms) || !ms || ms < 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function timelineProgressPercent(positionMs: number, durationMs: number) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return "0%";
  const raw = positionMs / durationMs;
  const percent = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 1) : 0;
  return Number((percent * 100).toFixed(1));
}
