import { useAudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import type { LibraryTrack } from '@/src/db';
import { idbUpdateTrackFileUri } from '@/src/db/indexeddb';
import { useLibraryStore, usePlayerStore } from '@/src/state';

let currentPlayer: ReturnType<typeof useAudioPlayer> | null = null;
let statusUpdateInterval: ReturnType<typeof setInterval> | null = null;
let lastManualUpdateTime = 0;
let lastReportedPositionMs = 0;
let lastReportedIsPlaying: boolean | null = null;
const MANUAL_UPDATE_COOLDOWN = 500; // Don't let interval overwrite manual updates for 500ms
const POSITION_UPDATE_THRESHOLD = 250; // Only update position if it changed by more than 250ms

function setupStatusUpdates(player: ReturnType<typeof useAudioPlayer>) {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
    statusUpdateInterval = null;
  }

  // Reset tracking when setting up new player
  lastReportedPositionMs = 0;
  lastReportedIsPlaying = null;

  statusUpdateInterval = setInterval(() => {
    try {
      // Read player state atomically to avoid race conditions
      const playerRef = player;
      if (!playerRef || playerRef !== currentPlayer) {
        return;
      }

      // Don't update if we just manually updated (to prevent race conditions)
      const timeSinceManualUpdate = Date.now() - lastManualUpdateTime;
      if (timeSinceManualUpdate < MANUAL_UPDATE_COOLDOWN) {
        return;
      }

      const isPlaying = !!playerRef.playing;
      const rawCurrentTime = playerRef.currentTime; // seconds

      const safeCurrentTimeSec = Number.isFinite(rawCurrentTime) && rawCurrentTime >= 0 ? rawCurrentTime : 0;
      const positionMs = Math.max(0, Math.floor(safeCurrentTimeSec * 1000));

      // Check if isPlaying changed
      const isPlayingChanged = lastReportedIsPlaying !== isPlaying;
      
      // Check if position changed significantly (to avoid micro-updates causing flicker)
      const positionDiff = Math.abs(positionMs - lastReportedPositionMs);
      const positionChanged = positionDiff > POSITION_UPDATE_THRESHOLD;

      // Only update if something meaningful changed
      if (isPlayingChanged || positionChanged) {
        lastReportedIsPlaying = isPlaying;
        lastReportedPositionMs = positionMs;
        
        usePlayerStore.getState().setPlaybackStatus({
          isPlaying,
          positionMs,
        });
      } else {
        // Update tracking even if we don't update store (for threshold calculation)
        lastReportedPositionMs = positionMs;
      }
    } catch (error) {
      console.warn('Error updating playback status:', error);
    }
  }, 500); // Update every 500ms
}

// This function needs to be called from a React component context
let createPlayerCallback: ((track: LibraryTrack) => void) | null = null;

export function setPlayerCallback(callback: (track: LibraryTrack) => void) {
  createPlayerCallback = callback;
}

const MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.mp4': 'audio/mp4',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
  '.wma': 'audio/x-ms-wma',
};

function getFileExtension(name: string) {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.substring(idx).toLowerCase() : '';
}

async function blobToDataUri(uri: string, fallbackName?: string) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const payload = result.split(',')[1] ?? result;
        resolve(payload);
      } else {
        reject(new Error('Failed to read blob'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });

  const extension = fallbackName ? getFileExtension(fallbackName) : '';
  const mime = blob.type || MIME_TYPES_BY_EXTENSION[extension] || 'audio/mpeg';
  return `data:${mime};base64,${base64}`;
}

async function ensurePlayableTrack(track: LibraryTrack): Promise<LibraryTrack> {
  if (Platform.OS !== 'web') {
    return track;
  }

  if (track.fileUri.startsWith('data:')) {
    return track;
  }

  if (track.fileUri.startsWith('blob:') || track.fileUri.startsWith('file:') || track.fileUri.startsWith('http')) {
    try {
      const dataUri = await blobToDataUri(track.fileUri, track.title);
      const updatedTrack = { ...track, fileUri: dataUri };

      // Update in library store so subsequent plays reuse the converted URI
      const { tracks } = useLibraryStore.getState();
      const index = tracks.findIndex((t) => t.id === track.id);
      if (index !== -1) {
        useLibraryStore.setState((state) => {
          const nextTracks = [...state.tracks];
          nextTracks[index] = updatedTrack;
          return { ...state, tracks: nextTracks };
        });
      }

      try {
        await idbUpdateTrackFileUri(track.id, dataUri);
      } catch (persistError) {
        console.warn('Failed to persist converted data URI to IndexedDB:', persistError);
      }

      return updatedTrack;
    } catch (error) {
      console.error('Failed to convert track to data URI:', error);
      throw error;
    }
  }

  return track;
}

export async function playTrack(track: LibraryTrack) {
  if (!createPlayerCallback) {
    console.error('Player callback not set. Make sure to call setPlayerCallback from a React component.');
    return;
  }

  try {
    // Clean up existing player if any
    if (currentPlayer) {
      try {
        currentPlayer.pause();
      } catch (e) {
        console.warn('Error pausing previous player:', e);
      }
      if (statusUpdateInterval) {
        clearInterval(statusUpdateInterval);
        statusUpdateInterval = null;
      }
    }

    const preparedTrack = await ensurePlayableTrack(track);

    console.log('Loading track:', preparedTrack.title, 'from URI:', preparedTrack.fileUri);

    // Request new player creation
    createPlayerCallback(preparedTrack);
  } catch (error) {
    console.error('Error in playTrack:', error);
    if (Platform.OS === 'web') {
      alert('Unable to play this track. Try re-importing it.');
    }
    throw error;
  }
}

export function setCurrentPlayer(player: ReturnType<typeof useAudioPlayer>, track: LibraryTrack) {
  currentPlayer = player;
  const { setActiveTrack, setPlaybackStatus, setQueue } = usePlayerStore.getState();

  try {
    console.log('Audio URI type:', track.fileUri.startsWith('blob:') ? 'blob' :
                                  track.fileUri.startsWith('file:') ? 'file' :
                                  track.fileUri.startsWith('http') ? 'http' : 'other');
    console.log('Full audio URI:', track.fileUri);

    player.play();
    console.log('Track loaded and playing successfully');
  } catch (loadError) {
    console.error('Failed to play audio file:', loadError);
    console.error('File URI:', track.fileUri);
    currentPlayer = null;

    // Show user-friendly error
    alert(`Unable to play "${track.title}". The file may have expired or is in an unsupported format. Please re-import your music.`);
    return;
  }

  // Reset tracking and update state before setting up interval
  lastReportedPositionMs = 0;
  lastReportedIsPlaying = true;
  lastManualUpdateTime = Date.now();
  
  setActiveTrack(track);
  setPlaybackStatus({ isPlaying: true, positionMs: 0 });
  setQueue([{ track, queuedAt: Date.now() }]);
  
  setupStatusUpdates(player);
}

export async function togglePlayPause() {
  if (!currentPlayer) {
    return;
  }

  try {
    const wasPlaying = currentPlayer.playing;
    const newIsPlaying = !wasPlaying;
    
    if (wasPlaying) {
      currentPlayer.pause();
    } else {
      currentPlayer.play();
    }
    
    // Update state immediately and mark the time to prevent interval from overwriting
    lastManualUpdateTime = Date.now();
    lastReportedIsPlaying = newIsPlaying;
    usePlayerStore.getState().setPlaybackStatus({ isPlaying: newIsPlaying });
  } catch (error) {
    console.error('Error in togglePlayPause:', error);
  }
}

export async function seekTo(positionMs: number) {
  if (!currentPlayer || !Number.isFinite(positionMs)) return;
  try {
    // Clamp seek within [0, duration]
    const durationSec = Number.isFinite(currentPlayer.duration) ? currentPlayer.duration : 0;
    const durationMs = durationSec > 0 ? durationSec * 1000 : undefined;
    const clampedMs = durationMs ? Math.min(Math.max(positionMs, 0), durationMs) : Math.max(positionMs, 0);
    currentPlayer.seekTo(clampedMs / 1000); // Convert to seconds
    
    // Update state immediately and mark the time to prevent interval from overwriting
    lastManualUpdateTime = Date.now();
    lastReportedPositionMs = clampedMs;
    usePlayerStore.getState().setPlaybackStatus({ positionMs: clampedMs });
  } catch (error) {
    console.error('Error seeking:', error);
  }
}

export async function setVolume(volume: number) {
  if (!currentPlayer || !Number.isFinite(volume)) return;
  try {
    const clamped = Math.min(Math.max(volume, 0), 1);
    currentPlayer.volume = clamped;
    usePlayerStore.getState().setVolume(clamped, clamped === 0);
  } catch (error) {
    console.error('Error setting volume:', error);
  }
}

export async function unloadPlayback() {
  if (!currentPlayer) return;
  try {
    currentPlayer.pause();
    if (statusUpdateInterval) {
      clearInterval(statusUpdateInterval);
      statusUpdateInterval = null;
    }
    currentPlayer = null;
    usePlayerStore.getState().setActiveTrack(null);
    usePlayerStore.getState().setPlaybackStatus({ isPlaying: false, positionMs: 0 });
  } catch (error) {
    console.error('Error unloading playback:', error);
  }
}

export async function skipNext() {
  const { activeTrack } = usePlayerStore.getState();
  if (!activeTrack) return;

  const tracks = useLibraryStore.getState().tracks;
  if (!tracks || tracks.length === 0) return;

  const currentIndex = tracks.findIndex((t) => t.id === activeTrack.id);
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % tracks.length : 0;
  const nextTrack = tracks[nextIndex];
  await playTrack(nextTrack);
}

export async function skipPrevious() {
  const { activeTrack, positionMs } = usePlayerStore.getState();
  if (!activeTrack) return;

  const tracks = useLibraryStore.getState().tracks;
  if (!tracks || tracks.length === 0) return;

  // If more than 2 seconds into the track, restart it
  if (positionMs > 2000) {
    await seekTo(0);
    return;
  }

  const currentIndex = tracks.findIndex((t) => t.id === activeTrack.id);
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
  const prevTrack = tracks[prevIndex];
  await playTrack(prevTrack);
}
