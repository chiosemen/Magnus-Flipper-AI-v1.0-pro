// Re-export prisma from core package for consistency
// Using lazy getter to avoid eager crash if Prisma client not generated
export { prisma, getPrisma } from "@magnus-flipper-ai/core/db";

