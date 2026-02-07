/**
 * Prisma Client singleton — development'ta hot reload'da tekrar oluşturulmayı önler.
 * Tüm servisler bu modülü kullanmalıdır (ölçeklenebilir, tek bağlantı havuzu).
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
