// packages/core/src/services/marketplaceControlService.ts
import { prisma } from '../db';
import type { MarketplaceControl } from '@prisma/client';

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

  return rows.map((row) => ({
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
