import {
  addTrackToPlaylist,
  createPlaylist,
  deletePlaylist,
  getAllPlaylists,
  getPlaylistWithTracks,
  removeTrackFromPlaylist,
  updatePlaylist,
  clearAllPlaylists,
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
    // Transform the data to match PlaylistSummary interface
    const transformedPlaylists = playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      coverImageUri: 'cover_image_uri' in playlist ? playlist.cover_image_uri : playlist.coverImageUri || null,
      isSystemPlaylist: 'is_system_playlist' in playlist ? playlist.is_system_playlist === 1 : playlist.isSystemPlaylist || false,
      createdAt: 'created_at' in playlist ? new Date(playlist.created_at) : playlist.createdAt,
      updatedAt: 'updated_at' in playlist ? new Date(playlist.updated_at) : playlist.updatedAt,
      trackCount: 'playlistTracks' in playlist ? playlist.playlistTracks.length : 0,
    }));
    setPlaylists(transformedPlaylists);
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

export async function clearAllPlaylistsService() {
  await clearAllPlaylists();
  await hydratePlaylistsFromDatabase();
}