import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { StrategyRegistrySchema, type StrategyRegistry } from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load and validate strategy registry from JSON file
 */
export function loadRegistry(): StrategyRegistry {
  const registryPath = join(__dirname, "registry.json");
  
  try {
    const raw = readFileSync(registryPath, "utf-8");
    const parsed = JSON.parse(raw);
    
    // Validate with Zod
    const result = StrategyRegistrySchema.safeParse(parsed);
    
    if (!result.success) {
      const errors = result.error.errors.map(e => 
        `${e.path.join(".")}: ${e.message}`
      ).join("\n");
      
      throw new Error(`Invalid registry configuration:\n${errors}`);
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load registry: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get marketplace config from registry
 */
export function getMarketplaceConfig(
  registry: StrategyRegistry,
  marketplace: string
): StrategyRegistry["marketplaces"][string] | null {
  return registry.marketplaces[marketplace] || null;
}

/**
 * Get global limits from registry
 */
export function getGlobalLimits(registry: StrategyRegistry): StrategyRegistry["globalLimits"] {
  return registry.globalLimits;
}

