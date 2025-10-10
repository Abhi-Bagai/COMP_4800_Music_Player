import Slider from '@react-native-community/slider';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { IconButton } from '@/src/components/ui/icon-button';
import { Text } from '@/src/components/ui/text';
import { useTrackScrubbing } from '@/src/hooks/use-track-scrubbing';
import { seekTo, setVolume, skipNext, skipPrevious, togglePlayPause } from '@/src/services/playback-service';
import { usePlayerStore } from '@/src/state';
import { useTheme } from '@/src/theme/provider';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface NowPlayingProps {
  visible: boolean;
  onClose: () => void;
}

export function NowPlaying({ visible, onClose }: NowPlayingProps) {
  const { tokens } = useTheme();
  const { activeTrack, isPlaying, volume } = usePlayerStore();
  const [slideAnim] = useState(new Animated.Value(screenHeight));
  
  const { currentDisplayPosition, isScrubbing, wheelProps, formatTime: formatScrubTime } = useTrackScrubbing({
    sensitivity: 50,
    debounceMs: 150,
  });

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : screenHeight,
      useNativeDriver: Platform.OS !== 'web',
      tension: 100,
      friction: 8,
    }).start();
  }, [visible, slideAnim]);

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
    const pct = (currentDisplayPosition / duration) * 100;
    if (!Number.isFinite(pct)) return 0;
    return Math.min(Math.max(pct, 0), 100);
  })();

  const artworkSize = useMemo(() => {
    // Responsive artwork size with upper bound
    const base = screenWidth * 0.86;
    return Math.min(base, 420);
  }, []);

  if (!activeTrack) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: tokens.colors.surface,
              transform: [{ translateY: slideAnim }]
            },
          ]}
        >
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <IconButton
                icon={<IconSymbol name="chevron.down" size={24} color={tokens.colors.text} />}
                onPress={onClose}
                accessibilityLabel="Close"
              />
              <View style={styles.headerInfo}>
                <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>Now Playing</Text>
                <Text style={[styles.headerSubtitle, { color: tokens.colors.subtleText }]}>From Your Library</Text>
              </View>
              <IconButton
                icon={<IconSymbol name="ellipsis" size={24} color={tokens.colors.text} />}
                accessibilityLabel="More options"
              />
            </View>

            {/* Album Artwork */}
            <View style={styles.artworkContainer}>
              <View
                style={[
                  styles.artwork,
                  { backgroundColor: tokens.colors.surfaceElevated, width: artworkSize, height: artworkSize },
                ]}
              >
                <View style={[styles.artworkInner, { backgroundColor: tokens.colors.primary }]}>
                  <IconSymbol name="music.note" size={80} color={tokens.colors.onPrimary} />
                </View>
              </View>
            </View>

            {/* Track Info */}
            <View style={styles.trackInfo}>
              <Text style={[styles.trackTitle, { color: tokens.colors.text }]} numberOfLines={1}>
                {activeTrack.title}
              </Text>
              <Text style={[styles.artistName, { color: tokens.colors.subtleText }]} numberOfLines={1}>
                {activeTrack.artist?.name ?? 'Unknown Artist'}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer} {...wheelProps as any}>
              {isScrubbing && (
                <View 
                  style={[
                    styles.scrubTooltip, 
                    { 
                      backgroundColor: tokens.colors.surface,
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
                <Text style={[styles.timeText, { color: tokens.colors.subtleText }]}>{formatTime(currentDisplayPosition)}</Text>
                <Text style={[styles.timeText, { color: tokens.colors.subtleText }]}>
                  {formatTime(activeTrack.durationMs || 0)}
                </Text>
              </View>
            </View>

            {/* Playback Controls */}
            <View style={styles.controls}>
              <IconButton
                icon={<IconSymbol name="backward.fill" size={32} color={tokens.colors.text} />}
                onPress={skipPrevious}
                accessibilityLabel="Previous track"
              />

              <Pressable
                style={[styles.playButton, { backgroundColor: tokens.colors.primary }]}
                onPress={handlePlayPause}
              >
                <IconSymbol
                  name={isPlaying ? 'pause.fill' : 'play.fill'}
                  size={28}
                  color={tokens.colors.onPrimary}
                  style={!isPlaying && { marginLeft: 2 }}
                />
              </Pressable>

              <IconButton
                icon={<IconSymbol name="forward.fill" size={32} color={tokens.colors.text} />}
                onPress={skipNext}
                accessibilityLabel="Next track"
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

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
              <IconButton
                icon={<IconSymbol name="quote.bubble" size={24} color={tokens.colors.subtleText} />}
                accessibilityLabel="Lyrics"
              />
              <IconButton
                icon={<IconSymbol name="airplayaudio" size={24} color={tokens.colors.subtleText} />}
                accessibilityLabel="AirPlay"
              />
              <IconButton
                icon={<IconSymbol name="list.bullet" size={24} color={tokens.colors.subtleText} />}
                accessibilityLabel="Up next"
              />
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  sheet: {
    paddingTop: Platform.OS === 'ios' ? 12 : 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerInfo: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },

  // Artwork
  artworkContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  artwork: {
    width: screenWidth * 0.8,
    height: screenWidth * 0.8,
    borderRadius: 20,
    padding: 4,
  },
  artworkInner: {
    flex: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Track Info
  trackInfo: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 18,
    textAlign: 'center',
  },

  // Progress
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
    position: 'relative',
  },
  progressBar: {
    width: '100%',
    height: 40,
  },
  progressThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  scrubTooltip: {
    position: 'absolute',
    top: -40,
    transform: [{ translateX: -20 }],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  scrubTooltipText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 60,
    marginBottom: 32,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Volume
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
    marginBottom: 32,
  },
  volumeSlider: {
    flex: 1,
    height: 40,
  },
  volumeThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
});
