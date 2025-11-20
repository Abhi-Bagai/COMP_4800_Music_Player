import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

/**
 * Prisma client singleton
 * In production, use connection pooling and handle disconnects gracefully
 */
const sqlite = new Database('./prisma/starlight.db');
const adapter = new PrismaBetterSQLite3(sqlite);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Graceful shutdown
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  sqlite.close();
});
