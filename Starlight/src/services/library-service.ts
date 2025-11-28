import { Platform } from 'react-native';
import {
  fetchLibrarySnapshot,
  upsertLibraryBatch,
  deleteTrackPermanently,
  clearAllTracks,
  updateTrackDuration,
  type LibraryBatchUpsert,
} from "@/src/db";
import { useLibraryStore } from "@/src/state";

export type { LibraryBatchUpsert };

export async function hydrateLibraryFromDatabase() {
  const setTracks = useLibraryStore.getState().setTracks;
  const setLoading = useLibraryStore.getState().setLoading;

  setLoading(true);
  try {
    const tracks = await fetchLibrarySnapshot();
    setTracks(tracks);
    
    // Update missing durations on startup (only once)
    updateMissingDurations(tracks);
  } finally {
    setLoading(false);
  }
}

/**
 * Updates track durations for tracks that are missing duration metadata.
 * This runs once on app startup and processes tracks in the background.
 * Uses HTML5 Audio API on web, skips on native (duration should be extracted during file scanning).
 */
async function updateMissingDurations(tracks: any[]) {
  // Only run on web platform
  if (Platform.OS !== 'web') {
    return;
  }

  // Find tracks missing duration
  const tracksNeedingDuration = tracks.filter(
    (track) => !track.durationMs || !Number.isFinite(track.durationMs)
  );

  if (tracksNeedingDuration.length === 0) {
    return;
  }

  console.log(`Found ${tracksNeedingDuration.length} tracks missing duration, updating in background...`);

  // Process tracks in batches to avoid overwhelming the system
  const BATCH_SIZE = 5;
  for (let i = 0; i < tracksNeedingDuration.length; i += BATCH_SIZE) {
    const batch = tracksNeedingDuration.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (track) => {
        try {
          // Use HTML5 Audio API to get duration
          const audio = new Audio(track.fileUri);
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Timeout loading audio metadata'));
            }, 5000);

            audio.addEventListener('loadedmetadata', () => {
              clearTimeout(timeout);
              const durationSec = audio.duration;
              
              if (durationSec && Number.isFinite(durationSec) && durationSec > 0) {
                const durationMs = Math.floor(durationSec * 1000);
                
                // Update database
                updateTrackDuration(track.id, durationMs).catch((error) => {
                  console.warn(`Failed to persist duration for ${track.title}:`, error);
                });
                
                // Update library store
                useLibraryStore.setState((state) => {
                  const trackIndex = state.tracks.findIndex((t) => t.id === track.id);
                  if (trackIndex !== -1) {
                    const nextTracks = [...state.tracks];
                    nextTracks[trackIndex] = { ...nextTracks[trackIndex], durationMs };
                    return { ...state, tracks: nextTracks };
                  }
                  return state;
                });

                console.log(`Updated duration for track: ${track.title} (${durationMs}ms)`);
              }
              
              // Clean up
              audio.src = '';
              resolve();
            });

            audio.addEventListener('error', (e) => {
              clearTimeout(timeout);
              reject(e);
            });

            // Start loading metadata
            audio.load();
          });
        } catch (error) {
          console.warn(`Failed to get duration for track ${track.title}:`, error);
        }
      })
    );

    // Small delay between batches
    if (i + BATCH_SIZE < tracksNeedingDuration.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log('Finished updating missing track durations');
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
