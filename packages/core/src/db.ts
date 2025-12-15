// Lazy Prisma client initialization to avoid eager crash if Prisma client not generated
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Type-only import (doesn't execute at runtime)
type PrismaClientType = any;

let _prisma: PrismaClientType | null = null;

export function getPrisma(): PrismaClientType {
  if (_prisma) return _prisma;

  try {
    // Lazy require to avoid eager crash if Prisma client not generated
    const pkg = require("@prisma/client");
    const { PrismaClient } = pkg;
    const { PrismaPg } = require("@prisma/adapter-pg");

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("Prisma not configured (DATABASE_URL missing)");
    }

    const prismaAdapter = new PrismaPg({ connectionString: databaseUrl });

    // @ts-ignore - Prisma client is generated at build time
    _prisma = new PrismaClient({
      adapter: prismaAdapter,
      log: process.env.NODE_ENV === "development" ? ["query", "info"] : [],
    });

    return _prisma;
  } catch (error: any) {
    if (error.code === "MODULE_NOT_FOUND" && error.message?.includes(".prisma/client")) {
      throw new Error("Prisma client not generated. Run: pnpm --filter @magnus-flipper-ai/core prisma generate");
    }
    throw error;
  }
}

// Export lazy getter as default for backward compatibility
// Using Proxy to make prisma.property access lazy
export const prisma = new Proxy({} as PrismaClientType, {
  get(_target, prop) {
    const client = getPrisma();
    const value = client[prop as keyof PrismaClientType];
    // If it's a function, bind it to the client
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Export as 'db' alias for backward compatibility
export const db = prisma;

// Export Prisma client for use across the monorepo
export default prisma;

// Note: PrismaClient type is not exported here to avoid build issues
// Import it directly from @prisma/client if needed for types
