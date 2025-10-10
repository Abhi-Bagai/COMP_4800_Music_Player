import { useCallback, useRef } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { Platform } from 'react-native';

import { seekTo } from '@/src/services/playback-service';
import { usePlayerStore } from '@/src/state';

interface UseTrackScrubbingOptions {
  /** Sensitivity multiplier for trackpad scrolling. Higher = more sensitive. Default: 50 */
  sensitivity?: number;
  /** Debounce time in ms to detect end of scrubbing. Default: 150 */
  debounceMs?: number;
}

export function useTrackScrubbing(options: UseTrackScrubbingOptions = {}) {
  const { sensitivity = 50, debounceMs = 150 } = options;
  const { activeTrack, positionMs, scrubbingPositionMs, setScrubbingPosition } = usePlayerStore();
  const scrubEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentDisplayPosition = scrubbingPositionMs ?? positionMs;
  const duration = activeTrack?.durationMs ?? 0;

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!activeTrack || Platform.OS !== 'web') return;

      // Detect horizontal scroll (2-finger left/right on trackpad)
      // Also support vertical scroll as fallback
      const deltaX = Math.abs(event.deltaX);
      const deltaY = Math.abs(event.deltaY);

      if (deltaX > 0 || deltaY > 0) {
        event.preventDefault();
        event.stopPropagation();

        // Use horizontal scroll primarily, fall back to vertical
        // Negate delta so scrolling right/down moves forward, left/up moves backward
        const delta = deltaX > deltaY ? -event.deltaX : -event.deltaY;

        // Calculate new position
        const currentPos = scrubbingPositionMs ?? positionMs;
        const change = (delta / sensitivity) * 1000; // Convert to milliseconds
        const newPosition = currentPos + change;

        // Clamp to valid range
        const clampedPosition = Math.max(0, Math.min(newPosition, duration));
        setScrubbingPosition(clampedPosition);

        // Clear existing timeout and set new one
        if (scrubEndTimeoutRef.current) {
          clearTimeout(scrubEndTimeoutRef.current);
        }

        scrubEndTimeoutRef.current = setTimeout(async () => {
          // End scrubbing: seek to the scrubbed position
          const finalPosition = usePlayerStore.getState().scrubbingPositionMs;
          if (finalPosition !== null) {
            console.log('Scrubbing ended, seeking to:', finalPosition);
            await seekTo(finalPosition);
            setScrubbingPosition(null);
          }
        }, debounceMs);
      }
    },
    [activeTrack, positionMs, scrubbingPositionMs, sensitivity, debounceMs, duration, setScrubbingPosition]
  );

  const attachWheelListener = useCallback(
    (element: HTMLElement | null) => {
      if (!element || Platform.OS !== 'web') return;

      console.log('Attaching wheel listener to element:', element);
      element.addEventListener('wheel', handleWheel as any, { passive: false });

      return () => {
        console.log('Removing wheel listener from element');
        element.removeEventListener('wheel', handleWheel as any);
        if (scrubEndTimeoutRef.current) {
          clearTimeout(scrubEndTimeoutRef.current);
        }
      };
    },
    [handleWheel]
  );

  const formatTime = (ms: number) => {
    if (!Number.isFinite(ms) || ms < 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // For web, create an onWheel handler that can be attached directly to elements
  const onWheelHandler = useCallback(
    (event: any) => {
      if (Platform.OS === 'web') {
        handleWheel(event.nativeEvent || event);
      }
    },
    [handleWheel]
  );

  // Return web-specific props for spreading onto Views
  const wheelProps = Platform.OS === 'web' ? { onWheel: onWheelHandler } : {};

  return {
    currentDisplayPosition,
    isScrubbing: scrubbingPositionMs !== null,
    attachWheelListener,
    onWheelHandler,
    wheelProps,
    formatTime,
    duration,
  };
}

