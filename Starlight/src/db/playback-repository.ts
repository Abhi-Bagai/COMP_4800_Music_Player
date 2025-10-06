import { eq } from 'drizzle-orm';
import { Platform } from 'react-native';

import { getDb, schema } from './client';
import { idbGetPlaybackState, idbPersistPlaybackState } from './indexeddb';

export interface PlaybackStatePayload {
  activeTrackId?: string | null;
  positionMs: number;
  volume: number;
  isMuted: boolean;
}

export async function getPlaybackState() {
  if (Platform.OS === 'web') {
    return await idbGetPlaybackState();
  }
  const db = await getDb();
  const result = await db.select().from(schema.playbackState).limit(1);
  return result.at(0) ?? null;
}

export async function persistPlaybackState(payload: PlaybackStatePayload) {
  if (Platform.OS === 'web') {
    await idbPersistPlaybackState(payload);
    return;
  }

  const db = await getDb();
  const existing = await getPlaybackState();

  if (!existing) {
    await db.insert(schema.playbackState).values({
      activeTrackId: payload.activeTrackId ?? null,
      positionMs: payload.positionMs,
      volume: payload.volume,
      isMuted: payload.isMuted ? 1 : 0,
      updatedAt: Date.now(),
    });
    return;
  }

  await db
    .update(schema.playbackState)
    .set({
      activeTrackId: payload.activeTrackId ?? null,
      positionMs: payload.positionMs,
      volume: payload.volume,
      isMuted: payload.isMuted ? 1 : 0,
      updatedAt: Date.now(),
    })
    .where(eq(schema.playbackState.id, existing.id));
}
