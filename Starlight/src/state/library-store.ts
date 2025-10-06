import { create } from 'zustand';

import type { LibraryTrack } from '@/src/db';

export interface LibraryState {
  tracks: LibraryTrack[];
  isLoading: boolean;
  lastSyncedAt?: number;
  setTracks: (tracks: LibraryTrack[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  tracks: [],
  isLoading: false,
  lastSyncedAt: undefined,
  setTracks: (tracks) => set({ tracks, lastSyncedAt: Date.now(), isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
