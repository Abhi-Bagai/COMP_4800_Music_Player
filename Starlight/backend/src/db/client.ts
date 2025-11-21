import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton
 * In production, use connection pooling and handle disconnects gracefully
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

/**
 * Graceful shutdown
 */
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
