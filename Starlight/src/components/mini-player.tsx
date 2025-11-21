import Slider from '@react-native-community/slider';
import React, { useEffect, useRef } from "react";
import { Pressable, StyleSheet, View, Animated, Dimensions } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Button } from "@/src/components/ui/button";
import { Text } from "@/src/components/ui/text";
import { useTrackScrubbing } from "@/src/hooks/use-track-scrubbing";
import {
  skipNext,
  skipPrevious,
  togglePlayPause,
  setVolume,
} from "@/src/services/playback-service";
import { usePlayerStore } from "@/src/state";
import { useTheme } from "@/src/theme/provider";

interface ScrollingTextProps {
  text: string;
  style: any;
  maxWidth: number;
}

function ScrollingText({ text, style, maxWidth }: ScrollingTextProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const textRef = useRef(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const previousText = useRef(text);

  useEffect(() => {
    if (!text || maxWidth <= 0) return;

    // Trim whitespace from text
    const trimmedText = text.trim();

    // Only restart animation when text actually changes (new track)
    if (previousText.current !== trimmedText) {
      // Stop any existing animation first
      if (animationRef.current) {
        animationRef.current.stop();
      }

      // Reset scroll position when text changes (new track starts playing)
      scrollX.setValue(0);
      previousText.current = trimmedText;
    } else {
      // If same text, don't restart animation
      return;
    }

    // Measure actual text width and start scrolling if it's longer than container
    const measureAndScroll = () => {
      // Create a temporary DOM element to measure the actual rendered text width
      const tempText = document.createElement('span');
      tempText.style.position = 'absolute';
      tempText.style.visibility = 'hidden';
      tempText.style.whiteSpace = 'nowrap';
      tempText.style.fontSize = style?.fontSize ? `${style.fontSize}px` : '16px';
      tempText.style.fontWeight = style?.fontWeight || '400';
      tempText.style.fontFamily = style?.fontFamily || 'system-ui';
      tempText.textContent = trimmedText;
      
      document.body.appendChild(tempText);
      const actualTextWidth = tempText.offsetWidth;
      document.body.removeChild(tempText);
      
      
      if (actualTextWidth > maxWidth) {
        // Calculate scroll distance needed to show hidden text with small buffer
        const scrollDistance = Math.max(actualTextWidth - maxWidth + 8, 0);
        
        // Calculate duration based on consistent scroll speed (30 pixels per second)
        const scrollSpeed = 30;
        const forwardDuration = Math.max(scrollDistance / scrollSpeed * 1000, 1500);
        
        const scrollAnimation = Animated.loop(
          Animated.sequence([
            Animated.delay(1500), // Wait 1.5 seconds before starting
            Animated.timing(scrollX, {
              toValue: -scrollDistance,
              duration: forwardDuration, // Duration based on consistent speed
              useNativeDriver: true,
            }),
            Animated.delay(1500), // Longer pause at the end
            Animated.timing(scrollX, {
              toValue: 0,
              duration: 800, // Keep smooth return
              useNativeDriver: true,
            }),
            Animated.delay(1500), // Longer pause before next cycle
          ])
        );

        // Store animation reference and start it
        animationRef.current = scrollAnimation;
        scrollAnimation.start();
      } else {
        // Reset position if text fits
        scrollX.setValue(0);
      }
    };

    measureAndScroll();
  }, [text, maxWidth, scrollX, style]);

  // Separate cleanup effect that only runs on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, []);

  return (
    <View style={[styles.scrollingTextContainer, { width: maxWidth }]}>
      <Animated.Text
        ref={textRef}
        style={[
          style,
          {
            transform: [{ translateX: scrollX }],
            whiteSpace: 'nowrap',
          },
        ]}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

interface MiniPlayerProps {
  onPress: () => void;
  onTagTrack?: () => void;
}

export function MiniPlayer({ onPress, onTagTrack }: MiniPlayerProps) {
  const { tokens } = useTheme();
  const { activeTrack, isPlaying, positionMs, volume } = usePlayerStore();

  const { currentDisplayPosition, isScrubbing, wheelProps, formatTime: formatScrubTime } = useTrackScrubbing({
    sensitivity: 50,
    debounceMs: 150,
  });

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
    const pct = (currentDisplayPosition / duration) * 100;
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

  const remaining = Math.max((activeTrack.durationMs ?? 0) - currentDisplayPosition, 0);

  return (
    <Pressable
      style={[
        styles.container,
        { 
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.background,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {/* Left Side - Track Info */}
        <View style={styles.leftSection}>
          <View style={styles.trackInfoContainer}>
            <ScrollingText
              text={activeTrack.title}
              style={[styles.trackTitle, { color: tokens.colors.text }]}
              maxWidth={180}
            />
            <ScrollingText
              text={activeTrack.album?.title ?? "Unknown Album"}
              style={[styles.albumName, { color: tokens.colors.subtleText }]}
              maxWidth={180}
            />
          </View>
          <Button
            size="sm"
            variant="primary"
            style={[
              styles.tagButton,
              { backgroundColor: "rgba(123, 97, 255, 0.15)" },
            ]}
            onPress={(e) => {
              e?.stopPropagation?.();
              onTagTrack?.();
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <IconSymbol
                name="tag"
                size={12}
                color="#C678FF"
              />
              <Text
                style={{
                  color: "#C678FF",
                  fontSize: 12,
                  fontWeight: "600",
                  
                }}
              >
                Tag Track
              </Text>
            </View>
          </Button>
        </View>

        {/* Center - Progress and Controls */}
        <View style={styles.centerSection} pointerEvents="box-none">
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
                color="#A3A5B3"
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
                color="#A3A5B3"
              />
            </Pressable>
            <Pressable style={styles.playButton} onPress={handlePlayPause}>
              <IconSymbol
                name={isPlaying ? "pause.fill" : "play.fill"}
                size={20}
                color="#A3A5B3"
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
                color="#A3A5B3"
              />
            </Pressable>
            <Pressable
              style={styles.controlButton}
              onPress={(e) => {
                e.stopPropagation();
              }}
            >
              <IconSymbol name="repeat" size={16} color="#A3A5B3" />
            </Pressable>
          </View>

          <Pressable
            style={styles.progressContainer}
            onPress={(e) => {
              e.stopPropagation();
            }}
            {...wheelProps as any}
          >
            {isScrubbing && (
              <View 
                style={[
                  styles.scrubTooltip, 
                  { 
                    backgroundColor: tokens.colors.surfaceElevated,
                    left: `${progressPercentage}%`,
                    shadowColor: tokens.colors.text,
                  }
                ]}
              >
                <Text style={[styles.scrubTooltipText, { color: tokens.colors.text }]}>
                  {formatScrubTime(currentDisplayPosition)}
                </Text>
              </View>
            )}
            <Text
              style={[styles.timeText, { color: tokens.colors.subtleText }]}
            >
              {formatTime(currentDisplayPosition)}
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
          </Pressable>
        </View>

        {/* Right Side - Volume */}
        <View style={styles.rightSection}>
          <IconSymbol
            name="speaker.wave.2"
            size={16}
            color={tokens.colors.primary}
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    borderTopWidth: 1,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
    gap: 20,
    position: "relative",
  },
  leftSection: {
    position: "absolute",
    left: 20,
    width: 280,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  trackInfoContainer: {
    flex: 1,
    gap: 2,
  },
  scrollingTextContainer: {
    overflow: 'hidden',
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  trackTitle: {
    fontSize: 16,
    fontWeight: "600",
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  albumName: {
    fontSize: 12,
    fontWeight: "400",
    flexWrap: 'nowrap',
    flexShrink: 0,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  centerSection: {
    position: "absolute",
    left: -20,
    right: -20,
    alignItems: "center",
    gap: 0,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 280,
    height: 20,
    gap: 12,
    position: "relative",
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
    height: 20,
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
    position: "absolute",
    right: 20,
    width: 120,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  volumeSlider: {
    flex: 1,
    height: 20,
  },
  scrubTooltip: {
    position: "absolute",
    top: -35,
    transform: [{ translateX: -25 }],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  scrubTooltipText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
