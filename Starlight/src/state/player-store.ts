import { create } from 'zustand';

import type { LibraryTrack } from '@/src/db';

export interface QueueItem {
  track: LibraryTrack;
  queuedAt: number;
}

interface PlayerState {
  queue: QueueItem[];
  activeTrack: LibraryTrack | null;
  isPlaying: boolean;
  positionMs: number;
  volume: number;
  isMuted: boolean;
  scrubbingPositionMs: number | null;
  setQueue: (queue: QueueItem[]) => void;
  setActiveTrack: (track: LibraryTrack | null) => void;
  setPlaybackStatus: (status: { isPlaying?: boolean; positionMs?: number }) => void;
  setVolume: (volume: number, isMuted?: boolean) => void;
  setScrubbingPosition: (positionMs: number | null) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  queue: [],
  activeTrack: null,
  isPlaying: false,
  positionMs: 0,
  volume: 1,
  isMuted: false,
  scrubbingPositionMs: null,
  setQueue: (queue) => set({ queue }),
  setActiveTrack: (track) => set({ activeTrack: track }),
  setPlaybackStatus: ({ isPlaying, positionMs }) =>
    set((prev) => {
      // Only update if values are actually provided and different
      const newIsPlaying = isPlaying !== undefined ? isPlaying : prev.isPlaying;
      const newPositionMs = positionMs !== undefined ? positionMs : prev.positionMs;
      
      // Only trigger update if something actually changed
      if (newIsPlaying === prev.isPlaying && newPositionMs === prev.positionMs) {
        return prev;
      }
      
      return {
        isPlaying: newIsPlaying,
        positionMs: newPositionMs,
      };
    }),
  setVolume: (volume, isMuted) =>
    set((prev) => ({
      volume,
      isMuted: isMuted ?? prev.isMuted,
    })),
  setScrubbingPosition: (scrubbingPositionMs) => set({ scrubbingPositionMs }),
}));
