# File Scanner Documentation

## Overview

The File Scanner service is responsible for discovering music files, extracting metadata, and importing them into the library. It handles both individual file selection and recursive directory scanning.

## Architecture

```
┌─────────────────────────────────────┐
│      FolderPicker Component         │
│  (User selects files/folder)        │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      FileScanner Class               │
│  - findMusicFiles()                  │
│  - processMusicFiles()               │
│  - extractMetadata()                 │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Metadata Extraction             │
│  - music-metadata library            │
│  - Filename fallback                 │
└─────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────┐
│      Database Import                 │
│  - upsertLibrary()                   │
│  - Batch processing                  │
└─────────────────────────────────────┘
```

## FileScanner Class

**File:** `src/services/file-scanner.ts`

Main class for scanning and processing music files.

### Constructor

```typescript
constructor(
  onProgress?: (progress: ScanProgress) => void,
  onComplete?: (summary: ScanSummary) => void,
  onError?: (error: Error) => void
)
```

**Callbacks:**
- `onProgress` - Called during scanning with progress updates
- `onComplete` - Called when scanning completes with summary
- `onError` - Called if an error occurs

### Supported Formats

The scanner recognizes these audio file extensions:
- `.mp3` - MPEG Audio
- `.m4a` - MPEG-4 Audio
- `.mp4` - MPEG-4 (audio)
- `.flac` - Free Lossless Audio Codec
- `.wav` - Waveform Audio
- `.aac` - Advanced Audio Coding
- `.ogg` - Ogg Vorbis
- `.wma` - Windows Media Audio

### Methods

#### `scanDirectory(directoryUri)`

Recursively scans a directory for music files.

```typescript
async scanDirectory(directoryUri: string): Promise<void>
```

**Process:**
1. Reads directory contents
2. Recursively processes subdirectories
3. Filters music files by extension
4. Calls `processMusicFiles()` with found files

**Platform Support:**
- **Native**: Full directory scanning via `expo-file-system`
- **Web**: Limited (requires folder selection via `webkitdirectory`)

**Usage:**
```typescript
const scanner = new FileScanner(onProgress, onComplete, onError);
await scanner.scanDirectory('/path/to/music');
```

#### `processMusicFiles(files)`

Processes an array of music files in batches.

```typescript
async processMusicFiles(files: MusicFile[]): Promise<void>
```

**Process:**
1. Groups files into batches of 20
2. For each file in batch:
   - Extracts metadata
   - Checks for duplicates
   - Creates/gets artist and album records
   - Converts file to data URI (web only)
   - Creates track record
3. Saves batch to database
4. Reports progress
5. Calls completion callback

**Batch Size:** 20 files per batch (configurable via `PROCESS_BATCH_SIZE`)

**Delay Between Batches:** 50ms (prevents UI blocking)

**Usage:**
```typescript
const files = [
  { uri: 'file:///path/to/song.mp3', name: 'song.mp3', size: 5000000, modificationTime: Date.now() }
];
await scanner.processMusicFiles(files);
```

### Metadata Extraction

The scanner uses a two-tier approach for metadata extraction:

#### Primary: Audio File Metadata

Uses the `music-metadata` library to read embedded tags from audio files.

**Extracted Fields:**
- `artist` - Artist name
- `album` - Album name
- `title` - Track title
- `duration` - Track duration (if available)
- `trackNumber` - Track number
- `discNumber` - Disc number
- `year` - Release year
- `genre` - Genre
- `bitrate` - Audio bitrate
- `sampleRate` - Sample rate

**Process:**
1. Reads file as `Uint8Array`
2. Determines MIME type from extension
3. Parses metadata using `music-metadata.parseBuffer()`
4. Extracts common metadata fields

**Fallback:** If metadata extraction fails, falls back to filename parsing.

#### Fallback: Filename Parsing

Parses common filename patterns to extract metadata.

**Supported Patterns:**
- `Artist - Album - Title.mp3`
- `Artist - Title.mp3`
- `Title.mp3` (uses "Unknown Artist" and "Unknown Album")

**Process:**
1. Removes file extension
2. Splits by ` - ` delimiter
3. Assigns parts to artist, album, title
4. Uses defaults for missing parts

### Duplicate Detection

The scanner checks for duplicate tracks before importing.

**Detection Method:**
- Compares track title and artist name
- Case-insensitive comparison
- Skips files that match existing tracks

**Implementation:**
```typescript
const exists = await checkTrackExists(sanitizedTitle, sanitizedArtist, file.size);
if (exists) {
  skippedCount++;
  continue;
}
```

**Note:** Currently checks by title + artist. Future: could use file hash for more accurate detection.

### File URI Conversion

#### Web Platform

On web, files are converted to data URIs for storage and playback.

**Process:**
1. If File object available: converts directly to base64
2. Otherwise: fetches file as blob, converts to base64
3. Determines MIME type from extension or blob type
4. Creates data URI: `data:audio/mpeg;base64,...`

**Why Data URIs?**
- Web browsers can't access file system directly
- Data URIs provide persistent access to file content
- Stored in IndexedDB for offline access

**Storage Consideration:**
- Data URIs can be large (entire file encoded in base64)
- Considered for future: store files separately, reference by hash

#### Native Platform

On native platforms, file URIs are used directly:
- `file:///path/to/file.mp3`
- No conversion needed
- Direct file system access

### Batch Processing

Files are processed in batches to prevent UI blocking and database timeouts.

**Configuration:**
```typescript
const PROCESS_BATCH_SIZE = 20; // Files per batch
```

**Process:**
1. Split files into batches of 20
2. Process each batch:
   - Extract metadata
   - Create database records
   - Save to database
3. Small delay between batches (50ms)
4. Report progress after each batch

**Benefits:**
- Prevents UI freezing
- Allows progress updates
- Reduces memory usage
- Handles large libraries gracefully

### Progress Reporting

The scanner reports progress during processing.

**Progress Object:**
```typescript
interface ScanProgress {
  currentFile: string;      // Currently processing file
  filesScanned: number;     // Files processed so far
  totalFiles: number;       // Total files to process
  percentage: number;       // Completion percentage
}
```

**Usage:**
```typescript
const scanner = new FileScanner(
  (progress) => {
    console.log(`${progress.percentage}% - ${progress.currentFile}`);
    updateProgressBar(progress.percentage);
  },
  // ...
);
```

### Completion Summary

After processing completes, a summary is provided.

**Summary Object:**
```typescript
interface ScanSummary {
  added: number;      // New tracks added
  skipped: number;    // Duplicate tracks skipped
  total: number;      // Total files processed
}
```

**Usage:**
```typescript
const scanner = new FileScanner(
  // ...
  (summary) => {
    console.log(`Added: ${summary.added}, Skipped: ${summary.skipped}`);
    showAlert(`Imported ${summary.added} new tracks!`);
  }
);
```

## Data Sanitization

All string data is sanitized before database storage.

**Sanitization Process:**
1. Removes control characters (`\x00-\x1F`, `\x7F-\x9F`)
2. Removes special characters (keeps alphanumeric, spaces, hyphens, underscores, dots)
3. Normalizes whitespace (multiple spaces → single space)
4. Trims leading/trailing whitespace

**Purpose:**
- Prevents database errors
- Ensures consistent formatting
- Prevents injection attacks
- Handles corrupted metadata gracefully

## ID Generation

Consistent IDs are generated from string inputs.

**Algorithm:**
- Simple hash function (djb2-like)
- Converts to base36 string
- Ensures same input → same ID

**Usage:**
- Artist IDs: generated from artist name
- Album IDs: generated from album name
- Track IDs: generated from filename + file size

**Benefits:**
- Consistent IDs across imports
- Prevents duplicate records
- No database auto-increment needed

## Error Handling

The scanner handles errors gracefully:

1. **Individual File Errors:**
   - Logged to console
   - File is skipped
   - Processing continues

2. **Metadata Extraction Errors:**
   - Falls back to filename parsing
   - Uses default values ("Unknown Artist", etc.)

3. **Database Errors:**
   - Logged to console
   - User-friendly alert shown
   - Partial import may succeed

4. **Fatal Errors:**
   - Calls `onError` callback
   - Stops processing
   - User is notified

## Platform-Specific Behavior

### Web

- **File Selection:** Folder selection via `webkitdirectory` or individual files
- **File Access:** File objects from file input
- **Storage:** Converts to data URIs, stores in IndexedDB
- **Limitations:** No recursive directory scanning (browser security)

### Native (iOS/Android)

- **File Selection:** Individual file selection via `expo-document-picker`
- **File Access:** Direct file system access
- **Storage:** Stores file URIs, uses SQLite
- **Capabilities:** Full recursive directory scanning

## Performance Considerations

1. **Batch Size:** 20 files per batch balances speed and responsiveness
2. **Delays:** 50ms delay between batches prevents UI blocking
3. **Metadata Caching:** Not yet implemented (future optimization)
4. **Parallel Processing:** Currently sequential (future: parallel batches)
5. **Progress Updates:** Throttled to prevent excessive re-renders

## Future Enhancements

Potential improvements:

- [ ] File hash-based duplicate detection
- [ ] Parallel batch processing
- [ ] Metadata caching
- [ ] Background scanning
- [ ] Incremental scanning (only new files)
- [ ] Artwork extraction
- [ ] BPM detection
- [ ] Genre classification
- [ ] Cloud storage integration
- [ ] Progress persistence across app restarts

## Usage Examples

### Basic File Import

```typescript
const scanner = new FileScanner(
  (progress) => console.log(`Progress: ${progress.percentage}%`),
  (summary) => console.log(`Added ${summary.added} tracks`),
  (error) => console.error('Error:', error)
);

const files = await pickFiles();
await scanner.processMusicFiles(files);
```

### Directory Scanning (Native)

```typescript
const scanner = new FileScanner(
  onProgress,
  onComplete,
  onError
);

await scanner.scanDirectory('/path/to/music/library');
```

### With UI Integration

```typescript
function FolderPicker() {
  const [progress, setProgress] = useState(null);
  
  const handleScan = async (files) => {
    const scanner = new FileScanner(
      (progress) => setProgress(progress),
      (summary) => {
        setProgress(null);
        Alert.alert('Complete', `Added ${summary.added} tracks`);
      },
      (error) => {
        setProgress(null);
        Alert.alert('Error', error.message);
      }
    );
    
    await scanner.processMusicFiles(files);
  };
  
  return (
    <View>
      {progress && <ProgressBar value={progress.percentage} />}
      <Button onPress={() => pickFiles().then(handleScan)}>
        Import Music
      </Button>
    </View>
  );
}
```

