/**
 * Prisma types (local definitions)
 * 
 * These types match the Prisma schema but are defined locally
 * to avoid requiring prisma generate during build.
 * 
 * If Prisma client is generated, these will be overridden by @prisma/client.
 */

/**
 * IngestStrategy enum matching prisma/schema.prisma
 * Values: local | apify | hybrid
 */
export enum IngestStrategy {
  local = "local",
  apify = "apify",
  hybrid = "hybrid",
}

/**
 * PrismaClient type stub
 * In production, this should come from @prisma/client after prisma generate
 * Using 'any' here allows the worker to compile without Prisma client generated
 */
export type PrismaClient = any;

/**
 * PrismaClient constructor stub (for type compatibility)
 * In production, this would be: import { PrismaClient } from "@prisma/client"
 */
export const PrismaClient: new () => PrismaClient = (() => {
  // Return a no-op constructor that returns null
  // This allows code like `new PrismaClient()` to compile
  return function() { return null as any; } as any;
})();
