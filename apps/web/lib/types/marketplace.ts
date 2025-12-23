/**
 * Local Marketplace Config Types
 * Decoupled from @magnus-flipper-ai/marketplace-config
 */

export interface ElitePoolConfig {
  id: string;
  poolId: string;
  marketplace: string;
  region: string;
  enabled: boolean;
  maxConcurrency: number;
  scrapeIntervalMinutes: number;
  cadenceMinutes: number;
  priority: number;
  estimatedMonthlyCU: number;
}

export interface MarketplaceConfig {
  marketplace: string;
  enabled: boolean;
  scraperConfig: {
    maxConcurrency: number;
    requestDelayMs: number;
    retryAttempts: number;
  };
}
