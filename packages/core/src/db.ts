import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "info"] : [],
});

// Export as 'db' alias for backward compatibility
export const db = prisma;

// Export Prisma client for use across the monorepo
export default prisma;

// Export types for convenience
export type { PrismaClient } from "@prisma/client";
