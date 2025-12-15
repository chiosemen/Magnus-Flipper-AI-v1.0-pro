import { z } from "zod";

/**
 * Zod schema for Strategy Registry JSON
 * Validates marketplace configuration and global limits
 */

export const TierSchema = z.enum(["free", "pro", "premium"]);

export const StrategySchema = z.enum(["local", "apify", "hybrid"]);

export const MarketplaceConcurrencySchema = z.object({
  free: z.number().int().min(0),
  pro: z.number().int().min(0),
  premium: z.number().int().min(0),
});

export const MarketplaceConfigSchema = z.object({
  strategy: StrategySchema,
  actorId: z.string().optional(), // Required if strategy is "apify" or "hybrid"
  concurrency: MarketplaceConcurrencySchema,
  hybridCandidate: z.boolean(),
}).refine(
  (data) => {
    // If strategy uses Apify, actorId must be present
    if (data.strategy === "apify" || data.strategy === "hybrid") {
      return !!data.actorId;
    }
    return true;
  },
  {
    message: "actorId is required when strategy is 'apify' or 'hybrid'",
  }
);

export const GlobalLimitsSchema = z.object({
  apifyConcurrency: MarketplaceConcurrencySchema,
  dailyApifyBudgetUSD: z.object({
    free: z.number().min(0),
    pro: z.number().min(0),
    premium: z.number().min(0),
  }),
});

export const StrategyRegistrySchema = z.object({
  marketplaces: z.record(z.string(), MarketplaceConfigSchema),
  globalLimits: GlobalLimitsSchema,
});

// Type exports
export type Tier = z.infer<typeof TierSchema>;
export type Strategy = z.infer<typeof StrategySchema>;
export type MarketplaceConcurrency = z.infer<typeof MarketplaceConcurrencySchema>;
export type MarketplaceConfig = z.infer<typeof MarketplaceConfigSchema>;
export type GlobalLimits = z.infer<typeof GlobalLimitsSchema>;
export type StrategyRegistry = z.infer<typeof StrategyRegistrySchema>;

