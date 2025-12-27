import type { PrismaClient } from '@prisma/client';
import { getConfig } from '../lib/config.js';

let client: PrismaClient | null = null;
let clientError: unknown | null = null;

export async function getPrismaClient(): Promise<PrismaClient | null> {
  const config = getConfig();

  if (!config.persistenceEnabled || !process.env.DATABASE_URL) {
    return null;
  }

  if (client) return client;
  if (clientError) return null;

  try {
    const prismaModule = await import('@prisma/client');
    const PrismaClientCtor = prismaModule.PrismaClient;
    client = new PrismaClientCtor();
    return client;
  } catch (error) {
    clientError = error;
    console.error('[guardian-api] prisma init failed', error);
    return null;
  }
}
