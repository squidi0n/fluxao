import { PrismaClient } from '@prisma/client';
// import { prismaCache } from './prisma-cache'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create base Prisma client with fresh instance
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['warn', 'error'],
  });

// TODO: Re-enable cache functionality after fixing Edge Runtime issues
// export const prisma = basePrisma.$extends(prismaCache)

// Store on global for development hot reloading
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
