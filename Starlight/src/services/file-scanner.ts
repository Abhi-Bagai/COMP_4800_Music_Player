import { checkTrackExists, findTrackByTitleAndArtist, updateTrackMetadata, type TrackMetadataUpdate } from '@/src/db';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as MusicMetadata from 'music-metadata';

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

  private async convertToDataUri(file: MusicFile & { file?: File }): Promise<string> {
    if (Platform.OS !== 'web') {
      return file.uri;
    }

    try {
      // If we have a File object directly (from folder selection), use it
      if (file.file) {
        const base64 = await this.fileToBase64(file.file);
        const extension = this.getFileExtension(file.name);
        const mime = MIME_TYPES_BY_EXTENSION[extension] || file.file.type || 'audio/mpeg';
        return `data:${mime};base64,${base64}`;
      }

      // Otherwise, fetch from URI (for individual file selection)
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

  private async fileToBase64(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result === 'string') {
          const base64 = result.split(',')[1] ?? result;
          resolve(base64);
        } else {
          reject(new Error('Unable to convert file to base64'));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
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
          // Extract metadata from filename (now with proper audio metadata library)
          const metadata = await this.extractMetadataFromFilename(file);
          const sanitizedTitle = this.sanitizeString(metadata.title);
          const sanitizedArtist = this.sanitizeString(metadata.artist);

          // Check if track already exists
          const existingTrack = await findTrackByTitleAndArtist(sanitizedTitle, sanitizedArtist);
          if (existingTrack) {
            // Track exists - check if we need to update any missing metadata
            const metadataUpdates: TrackMetadataUpdate = {};
            let hasUpdates = false;

            // Check each metadata field and add to updates if missing in existing track
            // Only update fields that are actually in MP3 metadata (not app-managed fields like trackNumber)
            // Only update fields that are null/undefined in the existing track but available in the new metadata
            if (!existingTrack.artworkUri && metadata.artworkUri) {
              metadataUpdates.artworkUri = metadata.artworkUri;
              hasUpdates = true;
            }
            if (!existingTrack.durationMs && metadata.durationMs) {
              metadataUpdates.durationMs = metadata.durationMs;
              hasUpdates = true;
            }
            if (!existingTrack.genre && metadata.genres) {
              metadataUpdates.genre = JSON.stringify(metadata.genres);
              hasUpdates = true;
            }
            // Note: trackNumber and discNumber are not updated here as they may be app-managed
            // They are still extracted and saved for new tracks, but not updated for existing ones
            if (!existingTrack.bitrate && metadata.bitrate) {
              metadataUpdates.bitrate = metadata.bitrate;
              hasUpdates = true;
            }
            if (!existingTrack.sampleRate && metadata.sampleRate) {
              metadataUpdates.sampleRate = metadata.sampleRate;
              hasUpdates = true;
            }

            if (hasUpdates) {
              // Update missing metadata fields
              console.log(`FileScanner: Updating missing metadata for existing track: ${sanitizedTitle} by ${sanitizedArtist}`, metadataUpdates);
              await updateTrackMetadata(existingTrack.id, metadataUpdates);
              skippedCount++; // Count as skipped since we're not adding a new track
            } else {
              console.log(`FileScanner: Skipping duplicate track: ${sanitizedTitle} by ${sanitizedArtist}`);
              skippedCount++;
            }
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
            durationMs: metadata.durationMs ?? null, // Extract duration from metadata
            genre: metadata.genres ? JSON.stringify(metadata.genres) : null, // Store genres as JSON array string
            artworkUri: metadata.artworkUri ?? null, // Extract artwork from metadata
            trackNumber: metadata.trackNumber ?? null,
            discNumber: metadata.discNumber ?? null,
            bitrate: metadata.bitrate ?? null,
            sampleRate: metadata.sampleRate ?? null,
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

  private async extractMetadataFromFilename(file: MusicFile): Promise<{
    artist: string;
    album: string;
    title: string;
    durationMs?: number | null;
    genres?: string[] | null;
    artworkUri?: string | null;
    trackNumber?: number | null;
    discNumber?: number | null;
    bitrate?: number | null;
    sampleRate?: number | null;
  }> {
    try {
      // First try to extract metadata from the actual audio file
      const metadata = await this.extractMetadataFromFile(file);
      if (metadata) {
        return metadata;
      }
    } catch (error) {
      console.warn(`Failed to extract metadata from file ${file.name}:`, error);
    }

    // Fallback to filename parsing if metadata extraction fails
    console.log("Fallback to filename parsing");
    const fallback = this.extractMetadataFromFilenameFallback(file);
    return {
      ...fallback,
      durationMs: null, // No duration available from filename parsing
      artworkUri: null, // No artwork available from filename parsing
      trackNumber: null,
      discNumber: null,
      bitrate: null,
      sampleRate: null,
    };
  }

  private async extractMetadataFromFile(file: MusicFile & { file?: File }): Promise<{
    artist: string;
    album: string;
    title: string;
    durationMs?: number | null;
    genres?: string[] | null;
    artworkUri?: string | null;
    trackNumber?: number | null;
    discNumber?: number | null;
    bitrate?: number | null;
    sampleRate?: number | null;
  } | null> {
    try {
      let fileBuffer: Uint8Array;
      
      if (Platform.OS === 'web') {
        // If we have a File object directly (from folder selection), use it
        if (file.file) {
          const arrayBuffer = await file.file.arrayBuffer();
          fileBuffer = new Uint8Array(arrayBuffer);
        } else {
          // Otherwise, fetch the file as a blob and convert to Uint8Array
          const response = await fetch(file.uri);
          const arrayBuffer = await response.arrayBuffer();
          fileBuffer = new Uint8Array(arrayBuffer);
        }
      } else {
        // For native platforms, read the file directly
        const fileUri = file.uri;
        const base64Data = await FileSystem.readAsStringAsync(fileUri, {
          encoding: 'base64',
        });
        // Convert base64 to Uint8Array for native platforms
        const binaryString = atob(base64Data);
        fileBuffer = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          fileBuffer[i] = binaryString.charCodeAt(i);
        }
      }

      // Determine MIME type from file extension
      const extension = this.getFileExtension(file.name);
      const mimeType = MIME_TYPES_BY_EXTENSION[extension] || (file.file?.type) || 'audio/mpeg';

      // Parse metadata using music-metadata library
      const metadata = await MusicMetadata.parseBuffer(fileBuffer, { mimeType });

      console.log("Metadata:", metadata);
      console.log("Common:", metadata.common);

      // Extract duration from metadata (format.duration is in seconds)
      const durationMs = metadata.format.duration 
        ? Math.floor(metadata.format.duration * 1000) 
        : null;

      // Extract all genres from metadata (genre is an array)
      const genres = metadata.common.genre && metadata.common.genre.length > 0
        ? metadata.common.genre.filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
        : null;

      // Extract album artwork from metadata (picture is an array)
      let artworkUri: string | null = null;
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        // Prefer cover art (type 3) or use first picture
        const coverPicture = metadata.common.picture.find(p => p.type === 'Cover (front)') || metadata.common.picture[0];
        if (coverPicture && coverPicture.data) {
          try {
            // Convert picture data to base64 data URI
            const format = coverPicture.format || 'image/jpeg';
            const base64 = this.bufferToBase64(coverPicture.data);
            artworkUri = `data:${format};base64,${base64}`;
          } catch (error) {
            console.warn(`Failed to convert artwork to data URI for ${file.name}:`, error);
          }
        }
      }

      // Extract track number (can be a number or object with 'no' and 'of' properties)
      const trackNumber = metadata.common.track 
        ? (typeof metadata.common.track === 'number' 
            ? metadata.common.track 
            : metadata.common.track.no ?? null)
        : null;

      // Extract disc number (can be a number or object with 'no' and 'of' properties)
      const discNumber = metadata.common.disk 
        ? (typeof metadata.common.disk === 'number' 
            ? metadata.common.disk 
            : metadata.common.disk.no ?? null)
        : null;

      // Extract bitrate and sample rate from format
      const bitrate = metadata.format.bitrate ?? null;
      const sampleRate = metadata.format.sampleRate ?? null;

      return {
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album || 'Unknown Album',
        title: metadata.common.title || this.getFallbackTitle(file.name),
        durationMs,
        genres,
        artworkUri,
        trackNumber,
        discNumber,
        bitrate,
        sampleRate,
      };
    } catch (error) {
      console.warn(`Error parsing metadata for ${file.name}:`, error);
      return null;
    }
  }

  private extractMetadataFromFilenameFallback(file: MusicFile): {
    artist: string;
    album: string;
    title: string;
  } {
    // Basic metadata extraction from filename (original implementation)
    console.log("Extracting metadata from filename fallback");
    console.log("File being scanned:", file);
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

  private getFallbackTitle(filename: string): string {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    return nameWithoutExt;
  }

  private bufferToBase64(buffer: Uint8Array | ArrayLike<number>): string {
    // Convert Uint8Array or array-like to base64 string
    // Handle both Buffer (Node.js) and Uint8Array (browser/React Native)
    const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
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
