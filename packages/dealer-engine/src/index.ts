/**
 * Dealer Engine Package
 * 
 * Provides dealer adapter registry and interfaces for used car lead distribution.
 */

export { getDealerRegistry } from "./registry.js";
export type {
  DealerAdapter,
  DealerOffer,
  DealerLeadInput,
  Vehicle,
} from "./types.js";

export { LocalDealerAdapter } from "./adapters/localDealer.js";
export { MarketplaceDealerAdapter } from "./adapters/marketplaceDealer.js";
export { InstantOfferDealerAdapter } from "./adapters/instantOfferDealer.js";

