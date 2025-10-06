import { fetchLibrarySnapshot, upsertLibraryBatch, deleteTrackPermanently, clearAllTracks, type LibraryBatchUpsert } from '@/src/db';
import { useLibraryStore } from '@/src/state';

export async function hydrateLibraryFromDatabase() {
  const setTracks = useLibraryStore.getState().setTracks;
  const setLoading = useLibraryStore.getState().setLoading;

  setLoading(true);
  try {
    const tracks = await fetchLibrarySnapshot();
    setTracks(tracks);
  } finally {
    setLoading(false);
  }
}

export async function upsertLibrary(records: LibraryBatchUpsert) {
  await upsertLibraryBatch(records);
  await hydrateLibraryFromDatabase();
}

export async function deleteTrack(trackId: string) {
  await deleteTrackPermanently(trackId);
  await hydrateLibraryFromDatabase();
}

export async function clearLibrary() {
  await clearAllTracks();
  await hydrateLibraryFromDatabase();
}
