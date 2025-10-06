import { useEffect } from 'react';

import { useAudioPlayer } from 'expo-audio';

import type { LibraryTrack } from '@/src/db';
import { setCurrentPlayer, setPlayerCallback } from '@/src/services/playback-service';

export function AudioPlaybackProvider() {
  const player = useAudioPlayer(null, {
    updateInterval: 250,
    keepAudioSessionActive: true,
  });

  useEffect(() => {
    const callback = (track: LibraryTrack) => {
      try {
        player.replace(track.fileUri);
        // Ensure playback restarts from the beginning for repeat selections
        void player.seekTo(0).catch(() => {});
        setCurrentPlayer(player, track);
      } catch (error) {
        console.error('Failed to start playback:', error);
      }
    };

    setPlayerCallback(callback);

    return () => {
      setPlayerCallback(() => {});
      try {
        player.pause();
      } catch {}
    };
  }, [player]);

  return null;
}

