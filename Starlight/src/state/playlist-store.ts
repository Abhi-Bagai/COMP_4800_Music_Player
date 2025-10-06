import { create } from 'zustand';

export interface PlaylistSummary {
  id: string;
  name: string;
  description: string | null;
  coverImageUri: string | null;
  isSystemPlaylist: boolean;
  createdAt: Date;
  updatedAt: Date;
  trackCount: number;
}

interface PlaylistState {
  playlists: PlaylistSummary[];
  isLoading: boolean;
  setPlaylists: (playlists: PlaylistSummary[]) => void;
  setLoading: (loading: boolean) => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  playlists: [],
  isLoading: false,
  setPlaylists: (playlists) => set({ playlists }),
  setLoading: (isLoading) => set({ isLoading }),
}));