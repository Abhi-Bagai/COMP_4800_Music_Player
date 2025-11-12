import { Platform } from 'react-native';

const TAG_STORAGE_KEY = 'starlight_track_tags';

export interface TrackTags {
  [trackId: string]: string[];
}

export async function getTrackTags(trackId: string): Promise<string[]> {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem(TAG_STORAGE_KEY);
      if (stored) {
        const allTags: TrackTags = JSON.parse(stored);
        return allTags[trackId] || [];
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  }
  return [];
}

export async function saveTrackTags(trackId: string, tags: string[]): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem(TAG_STORAGE_KEY);
      const allTags: TrackTags = stored ? JSON.parse(stored) : {};
      
      if (tags.length === 0) {
        // Remove track entry if no tags
        delete allTags[trackId];
      } else {
        allTags[trackId] = tags;
      }
      
      localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(allTags));
    } catch (error) {
      console.error('Error saving tags:', error);
    }
  }
}

export async function getAllTrackTags(): Promise<TrackTags> {
  if (Platform.OS === 'web') {
    try {
      const stored = localStorage.getItem(TAG_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading all tags:', error);
      return {};
    }
  }
  return {};
}
