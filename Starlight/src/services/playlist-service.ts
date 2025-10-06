import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  getAllPlaylists,
  getPlaylistWithTracks,
  removeTrackFromPlaylist,
  updatePlaylist,
  type CreatePlaylistData,
  type PlaylistWithTracks,
} from '@/src/db/playlist-repository';
import { usePlaylistStore } from '@/src/state/playlist-store';

export async function hydratePlaylistsFromDatabase() {
  const setPlaylists = usePlaylistStore.getState().setPlaylists;
  const setLoading = usePlaylistStore.getState().setLoading;

  setLoading(true);
  try {
    const playlists = await getAllPlaylists();
    setPlaylists(playlists);
  } finally {
    setLoading(false);
  }
}

export async function createNewPlaylist(data: CreatePlaylistData) {
  const playlistId = await createPlaylist(data);
  await hydratePlaylistsFromDatabase();
  return playlistId;
}

export async function addTrackToPlaylistById(playlistId: string, trackId: string) {
  await addTrackToPlaylist(playlistId, trackId);
  await hydratePlaylistsFromDatabase();
}

export async function removeTrackFromPlaylistById(playlistId: string, trackId: string) {
  await removeTrackFromPlaylist(playlistId, trackId);
  await hydratePlaylistsFromDatabase();
}

export async function deletePlaylistById(playlistId: string) {
  await deletePlaylist(playlistId);
  await hydratePlaylistsFromDatabase();
}

export async function updatePlaylistById(playlistId: string, data: Partial<CreatePlaylistData>) {
  await updatePlaylist(playlistId, data);
  await hydratePlaylistsFromDatabase();
}

export async function getPlaylistDetails(playlistId: string): Promise<PlaylistWithTracks | null> {
  return await getPlaylistWithTracks(playlistId);
}