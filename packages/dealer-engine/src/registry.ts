import type { DealerAdapter } from "./types.js";
import { LocalDealerAdapter } from "./adapters/localDealer.js";
import { MarketplaceDealerAdapter } from "./adapters/marketplaceDealer.js";
import { InstantOfferDealerAdapter } from "./adapters/instantOfferDealer.js";

/**
 * Dealer Adapter Registry
 * 
 * Central registry for all dealer adapters.
 * In production, this could be loaded from config or database.
 */
class DealerRegistry {
  private adapters: Map<string, DealerAdapter> = new Map();

  constructor() {
    // Register default adapters
    this.register(new LocalDealerAdapter());
    this.register(new MarketplaceDealerAdapter());
    this.register(new InstantOfferDealerAdapter());
  }

  register(adapter: DealerAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): DealerAdapter | undefined {
    return this.adapters.get(id);
  }

  getAll(): DealerAdapter[] {
    return Array.from(this.adapters.values());
  }

  getActiveDealers(): DealerAdapter[] {
    // In production, filter by dealer status/availability
    return this.getAll();
  }
}

// Singleton instance
let registryInstance: DealerRegistry | null = null;

export function getDealerRegistry(): DealerRegistry {
  if (!registryInstance) {
    registryInstance = new DealerRegistry();
  }
  return registryInstance;
}

