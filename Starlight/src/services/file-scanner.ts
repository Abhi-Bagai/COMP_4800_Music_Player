import { checkTrackExists } from '@/src/db';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

import { upsertLibrary, type LibraryBatchUpsert } from './library-service';

export interface MusicFile {
  uri: string;
  name: string;
  size: number;
  modificationTime: number;
}

export interface ScanProgress {
  currentFile: string;
  filesScanned: number;
  totalFiles: number;
  percentage: number;
}

export interface ScanSummary {
  added: number;
  skipped: number;
  total: number;
}

// Common music file extensions
const MUSIC_EXTENSIONS = ['.mp3', '.m4a', '.mp4', '.flac', '.wav', '.aac', '.ogg', '.wma'];

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

export class FileScanner {
  private isScanning = false;
  private onProgress?: (progress: ScanProgress) => void;
  private onComplete?: (summary: ScanSummary) => void;
  private onError?: (error: Error) => void;

  constructor(
    onProgress?: (progress: ScanProgress) => void,
    onComplete?: (summary: ScanSummary) => void,
    onError?: (error: Error) => void
  ) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  async scanDirectory(directoryUri: string): Promise<void> {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

    this.isScanning = true;

    try {
      const musicFiles = await this.findMusicFiles(directoryUri);
      await this.processMusicFiles(musicFiles);
      // onComplete is called from processMusicFiles with the summary
    } catch (error) {
      this.onError?.(error as Error);
    } finally {
      this.isScanning = false;
    }
  }

  private async findMusicFiles(directoryUri: string): Promise<MusicFile[]> {
    const musicFiles: MusicFile[] = [];
    
    try {
      const files = await FileSystem.readDirectoryAsync(directoryUri);
      
      for (const file of files) {
        const fileUri = `${directoryUri}/${file}`;
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        if (fileInfo.exists) {
          if (fileInfo.isDirectory) {
            // Recursively scan subdirectories
            const subFiles = await this.findMusicFiles(fileUri);
            musicFiles.push(...subFiles);
          } else if (this.isMusicFile(file)) {
            musicFiles.push({
              uri: fileUri,
              name: file,
              size: fileInfo.size || 0,
              modificationTime: fileInfo.modificationTime || 0,
            });
          }
        }
      }
    } catch (error) {
      console.warn(`Error scanning directory ${directoryUri}:`, error);
    }

    return musicFiles;
  }

  private isMusicFile(filename: string): boolean {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return MUSIC_EXTENSIONS.includes(extension);
  }

  private async convertToDataUri(file: MusicFile): Promise<string> {
    if (Platform.OS !== 'web') {
      return file.uri;
    }

    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      const extension = this.getFileExtension(file.name);
      const mime = MIME_TYPES_BY_EXTENSION[extension] || blob.type || 'audio/mpeg';
      return `data:${mime};base64,${base64}`;
    } catch (error) {
      console.warn(`Failed to convert ${file.name} to data URI:`, error);
      return file.uri;
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1] ?? result;
          resolve(base64);
        } else {
          reject(new Error('Unable to convert blob to base64'));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
      reader.readAsDataURL(blob);
    });
  }

  private getFileExtension(name: string): string {
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.substring(idx).toLowerCase() : '';
  }

  async processMusicFiles(files: MusicFile[]): Promise<void> {
    console.log('FileScanner: Starting to process', files.length, 'files');

    const PROCESS_BATCH_SIZE = 20; // Process files in smaller batches
    let skippedCount = 0;
    let addedCount = 0;

    for (let batchStart = 0; batchStart < files.length; batchStart += PROCESS_BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + PROCESS_BATCH_SIZE, files.length);
      const fileBatch = files.slice(batchStart, batchEnd);

      console.log(`FileScanner: Processing batch ${Math.floor(batchStart / PROCESS_BATCH_SIZE) + 1} (files ${batchStart + 1}-${batchEnd} of ${files.length})`);

      const batch: LibraryBatchUpsert = {
        artists: [],
        albums: [],
        tracks: [],
      };

      const artistMap = new Map<string, string>();
      const albumMap = new Map<string, string>();

      for (let i = 0; i < fileBatch.length; i++) {
        const file = fileBatch[i];
        const overallIndex = batchStart + i;

        console.log(`FileScanner: Processing file ${overallIndex + 1}/${files.length}:`, file.name);

        this.onProgress?.({
          currentFile: file.name,
          filesScanned: overallIndex + 1,
          totalFiles: files.length,
          percentage: Math.round(((overallIndex + 1) / files.length) * 100),
        });

        try {
          // Extract metadata from filename (basic implementation)
          const metadata = this.extractMetadataFromFilename(file);
          const sanitizedTitle = this.sanitizeString(metadata.title);
          const sanitizedArtist = this.sanitizeString(metadata.artist);

          // Check if track already exists
          const exists = await checkTrackExists(sanitizedTitle, sanitizedArtist, file.size || 0);
          if (exists) {
            console.log(`FileScanner: Skipping duplicate track: ${sanitizedTitle} by ${sanitizedArtist}`);
            skippedCount++;
            continue;
          }

          // Create or get artist
          let artistId = artistMap.get(metadata.artist);
          if (!artistId) {
            artistId = this.generateId(metadata.artist);
            artistMap.set(metadata.artist, artistId);
            batch.artists.push({
              id: artistId,
              name: sanitizedArtist,
              sortKey: sanitizedArtist.toLowerCase(),
            });
          }

          // Create or get album
          const albumKey = `${metadata.artist}|${metadata.album}`;
          let albumId = albumMap.get(albumKey);
          if (!albumId) {
            albumId = this.generateId(metadata.album);
            albumMap.set(albumKey, albumId);
            batch.albums.push({
              id: albumId,
              artistId,
              title: this.sanitizeString(metadata.album),
              sortKey: this.sanitizeString(metadata.album.toLowerCase()),
            });
          }

          // Keep original URI (blob on web) to avoid oversized strings in DB
          const persistentUri = await this.convertToDataUri(file);
          console.log(`FileScanner: Using URI for ${file.name}:`);
          console.log(`  Value: ${persistentUri.substring(0, 50)}...`);

          const trackData = {
            id: this.generateId(file.name + file.size), // Use name + size for consistent ID
            albumId,
            artistId,
            title: sanitizedTitle,
            fileUri: persistentUri, // Use the persistent data URI
            fileSize: file.size || 0,
            fileMtime: Math.floor((file.modificationTime || Date.now()) / 1000), // Convert to seconds
          };
          batch.tracks.push(trackData);
          addedCount++;
        } catch (error) {
          console.warn(`Error processing file ${file.name}:`, error);
        }
      }

      console.log(`FileScanner: Batch ${Math.floor(batchStart / PROCESS_BATCH_SIZE) + 1} summary:`, {
        artists: batch.artists.length,
        albums: batch.albums.length,
        tracks: batch.tracks.length
      });

      // Save batch to database
      if (batch.tracks.length > 0) {
        console.log(`FileScanner: Saving batch ${Math.floor(batchStart / PROCESS_BATCH_SIZE) + 1} to database...`);
        await upsertLibrary(batch);
        console.log(`FileScanner: Batch ${Math.floor(batchStart / PROCESS_BATCH_SIZE) + 1} saved successfully`);
      }

      // Small delay between batches to prevent UI blocking
      if (batchEnd < files.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log('FileScanner: All files processed successfully');
    console.log(`FileScanner: Summary - Added: ${addedCount}, Skipped (duplicates): ${skippedCount}, Total: ${files.length}`);

    // Pass the summary info to the completion callback
    const summary: ScanSummary = {
      added: addedCount,
      skipped: skippedCount,
      total: files.length
    };

    if (this.onComplete) {
      this.onComplete(summary);
    }
  }

  private extractMetadataFromFilename(file: MusicFile): {
    artist: string;
    album: string;
    title: string;
  } {
    // Basic metadata extraction from filename
    // This is a simple implementation - in a real app you'd use a proper audio metadata library
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    
    // Try to parse common patterns like "Artist - Album - Title" or "Artist - Title"
    const parts = nameWithoutExt.split(' - ');
    
    if (parts.length >= 3) {
      return {
        artist: parts[0].trim(),
        album: parts[1].trim(),
        title: parts.slice(2).join(' - ').trim(),
      };
    } else if (parts.length === 2) {
      return {
        artist: parts[0].trim(),
        album: 'Unknown Album',
        title: parts[1].trim(),
      };
    } else {
      return {
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        title: nameWithoutExt,
      };
    }
  }

  private generateId(input: string): string {
    // Simple hash function to generate consistent IDs
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private sanitizeString(input: string): string {
    if (!input) return '';
    
    // Aggressively sanitize to prevent any JSON parsing issues
    return input
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .replace(/[^a-zA-Z0-9\s\-_\.]/g, '') // Keep only alphanumeric, spaces, hyphens, underscores, and dots
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  getIsScanning(): boolean {
    return this.isScanning;
  }
}
