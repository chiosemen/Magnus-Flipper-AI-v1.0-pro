// @ts-ignore - Prisma client is generated at build time
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Missing DATABASE_URL environment variable for Prisma");
}

const prismaAdapter = new PrismaPg({ connectionString: databaseUrl });

// @ts-ignore - Prisma client is generated at build time
export const prisma = new PrismaClient({
  adapter: prismaAdapter,
  log: process.env.NODE_ENV === "development" ? ["query", "info"] : [],
});

// Export as 'db' alias for backward compatibility
export const db = prisma;

// Export Prisma client for use across the monorepo
export default prisma;

// Export types for convenience
// @ts-ignore - Prisma client is generated at build time
export type { PrismaClient } from "@prisma/client";
