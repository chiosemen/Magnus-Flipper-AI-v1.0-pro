// packages/core/src/services/marketplaceControlService.ts
import { prisma } from '../db.js';

// MarketplaceControl type - using Prisma schema structure
// Note: Prisma client must be generated for full type safety
export interface MarketplaceControl {
  id: string;
  marketplace: string;
  enabled: boolean;
  maxConcurrency: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketplaceControlDTO {
  marketplace: string;
  enabled: boolean;
  maxConcurrency: number;
}

const DEFAULT_MAX_CONCURRENCY = 5;

export async function getAllMarketplaceControls(): Promise<MarketplaceControlDTO[]> {
  const rows = await prisma.marketplaceControl.findMany({
    orderBy: { marketplace: 'asc' }
  });

  return rows.map((row: any) => ({
    marketplace: row.marketplace,
    enabled: row.enabled,
    maxConcurrency: row.maxConcurrency
  }));
}

export async function upsertMarketplaceControl(
  input: MarketplaceControlDTO
): Promise<MarketplaceControlDTO> {
  const row = await prisma.marketplaceControl.upsert({
    where: { marketplace: input.marketplace },
    create: {
      marketplace: input.marketplace,
      enabled: input.enabled,
      maxConcurrency: input.maxConcurrency
    },
    update: {
      enabled: input.enabled,
      maxConcurrency: input.maxConcurrency
    }
  });

  return {
    marketplace: row.marketplace,
    enabled: row.enabled,
    maxConcurrency: row.maxConcurrency
  };
}

export async function getMarketplaceEffectiveControl(
  marketplace: string
): Promise<MarketplaceControlDTO> {
  const row = await prisma.marketplaceControl.findUnique({
    where: { marketplace }
  });

  if (!row) {
    // default: enabled with default maxConcurrency
    return {
      marketplace,
      enabled: true,
      maxConcurrency: DEFAULT_MAX_CONCURRENCY
    };
  }

  return {
    marketplace: row.marketplace,
    enabled: row.enabled,
    maxConcurrency: row.maxConcurrency
  };
}
