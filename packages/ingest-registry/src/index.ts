/**
 * Ingest Registry Package
 * 
 * Provides strategy registry for marketplace ingestion routing.
 * Config-driven approach allows changing marketplace strategies without code changes.
 */

export { loadRegistry, getMarketplaceConfig, getGlobalLimits } from "./loader.js";
export {
  StrategyRegistrySchema,
  TierSchema,
  StrategySchema,
  MarketplaceConcurrencySchema,
  MarketplaceConfigSchema,
  GlobalLimitsSchema,
  type Tier,
  type Strategy,
  type MarketplaceConcurrency,
  type MarketplaceConfig,
  type GlobalLimits,
  type StrategyRegistry,
} from "./schema.js";

