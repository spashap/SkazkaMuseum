import { PrismaClient } from '@prisma/client';

// Single Prisma instance (avoids exhausting connections during dev hot-reload).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ log: ['error', 'warn'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
