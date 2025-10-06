import { drizzle, ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync, SQLiteDatabase, SQLiteOpenOptions } from 'expo-sqlite';
import { Platform } from 'react-native';

import { runInitialMigration } from './migrations/sql';
import * as schema from './schema';

let rawSqliteInstance: SQLiteDatabase | null = null;
let drizzleInstance: ExpoSQLiteDatabase<typeof schema> | null = null;
let rawPromise: Promise<SQLiteDatabase> | null = null;
let drizzlePromise: Promise<ExpoSQLiteDatabase<typeof schema>> | null = null;

function ensureNativePlatform() {
  if (Platform.OS === 'web') {
    throw new Error(
      'SQLite is not available on web. Use the IndexedDB helpers instead of getDb()/getRawDb().'
    );
  }
}

export async function getRawDb(): Promise<SQLiteDatabase> {
  ensureNativePlatform();

  if (rawSqliteInstance) {
    return rawSqliteInstance;
  }
  if (rawPromise) {
    return rawPromise;
  }

  rawPromise = (async () => {
    const options: SQLiteOpenOptions = {};
    try {
      rawSqliteInstance = await openDatabaseAsync('starlight.db', options);
      await runInitialMigration(rawSqliteInstance);
      return rawSqliteInstance;
    } catch (error: any) {
      console.warn('Falling back to in-memory SQLite instance:', error?.message ?? error);
      rawSqliteInstance = await openDatabaseAsync(':memory:', options);
      await runInitialMigration(rawSqliteInstance);
      return rawSqliteInstance;
    }
  })();

  try {
    return await rawPromise;
  } finally {
    rawPromise = null;
  }
}

export async function getDb(): Promise<ExpoSQLiteDatabase<typeof schema>> {
  ensureNativePlatform();

  if (drizzleInstance) {
    return drizzleInstance;
  }
  if (drizzlePromise) {
    return drizzlePromise;
  }

  drizzlePromise = (async () => {
    const sqlite = await getRawDb();
    drizzleInstance = drizzle(sqlite, { schema });
    return drizzleInstance;
  })();

  try {
    return await drizzlePromise;
  } finally {
    drizzlePromise = null;
  }
}

export type StarlightDatabase = Awaited<ReturnType<typeof getDb>>;

export { schema };

