/**
 * Feature Flags for Worker Dealer
 * 
 * Controls whether the dealer engine subsystem is enabled.
 * Set DEALER_ENGINE_ENABLED=true to enable.
 */

export const FEATURE_FLAGS = {
  DEALER_ENGINE_ENABLED:
    process.env.DEALER_ENGINE_ENABLED === "true",
};

