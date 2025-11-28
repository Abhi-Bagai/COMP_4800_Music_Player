export const INITIAL_MIGRATION = [
  `CREATE TABLE IF NOT EXISTS artists (
    id TEXT PRIMARY KEY,
    name TEXT,
    sort_key TEXT,
    created_at INTEGER,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS albums (
    id TEXT PRIMARY KEY,
    artist_id TEXT,
    title TEXT,
    sort_key TEXT,
    year INTEGER,
    artwork_uri TEXT,
    primary_color TEXT,
    created_at INTEGER,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS tracks (
    id TEXT PRIMARY KEY,
    album_id TEXT,
    artist_id TEXT,
    title TEXT,
    duration_ms INTEGER,
    disc_number INTEGER,
    track_number INTEGER,
    bitrate INTEGER,
    sample_rate INTEGER,
    genre TEXT,
    file_uri TEXT,
    file_mtime INTEGER,
    file_size INTEGER,
    hash TEXT,
    is_deleted INTEGER,
    created_at INTEGER,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS playback_state (
    id INTEGER PRIMARY KEY,
    active_track_id TEXT,
    position_ms INTEGER,
    volume REAL,
    is_muted INTEGER,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS playlists (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    cover_image_uri TEXT,
    is_system_playlist INTEGER,
    created_at INTEGER,
    updated_at INTEGER
  )`,
  `CREATE TABLE IF NOT EXISTS playlist_tracks (
    id TEXT PRIMARY KEY,
    playlist_id TEXT,
    track_id TEXT,
    position INTEGER,
    added_at INTEGER
  )`,
  // Add genre column to existing tracks table if it doesn't exist
  // This will fail silently if the column already exists, which is fine
  `ALTER TABLE tracks ADD COLUMN genre TEXT`
];

export async function runInitialMigration(db: { execAsync: (sql: string) => Promise<void> }) {
  try {
    // Run migrations one by one with error handling
    for (let i = 0; i < INITIAL_MIGRATION.length; i++) {
      const statement = INITIAL_MIGRATION[i];
      try {
        await db.execAsync(statement);
        console.log(`Migration step ${i + 1} completed successfully`);
      } catch (error: any) {
        // For ALTER TABLE statements, ignore "duplicate column" errors
        // This allows the migration to work on both new and existing databases
        if (statement.includes('ALTER TABLE') && error.message?.includes('duplicate column')) {
          console.log(`Migration step ${i + 1} skipped (column already exists)`);
          continue;
        }
        console.error(`Migration step ${i + 1} failed:`, error.message);
        console.error('Statement:', statement);
        throw error; // Stop on first error
      }
    }
    console.log('All migrations completed successfully');
  } catch (error: any) {
    console.error('Migration process failed:', error.message);
    throw error;
  }
}