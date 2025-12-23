// apps/web/src/lib/admin/marketplace.ts

import { loadConfig } from "@magnus-flipper-ai/deal-engine/config";
import type { DealEngineConfig } from "@magnus-flipper-ai/deal-engine/config";

/**
 * Marketplace configuration integration
 * Wired up to @magnus-flipper-ai/deal-engine package
 */

export async function fetchMarketplaceConfig(): Promise<DealEngineConfig> {
  try {
    // Load configuration from environment variables via deal-engine
    const config = loadConfig();
    return config;
  } catch (error) {
    console.error("Error fetching marketplace config:", error);
    // Return minimal fallback config
    return {
      preferredProvider: "deepseek",
      deepseekApiKey: "",
      deepseekApiUrl: "https://api.deepseek.com/v1/chat/completions",
      openaiApiKey: "",
      openaiModel: "gpt-4o",
      maxRetries: 3,
      retryDelayMs: 1000,
      failoverThreshold: 3,
      failoverWindowMs: 60000,
      llmWeight: 0.55,
      baselineWeight: 0.25,
      demandWeight: 0.20,
      llmTimeoutMs: 30000,
      optimismPenalty: 0.85,
      cacheTTLSeconds: 3600,
      enableCache: true,
      tierLimits: {
        FREE: { dailyScores: 10, maxConcurrent: 1 },
        PRO: { dailyScores: 100, maxConcurrent: 3 },
        AGENCY: { dailyScores: 1000, maxConcurrent: 10 },
        ADMIN: { dailyScores: -1, maxConcurrent: 20 },
      },
      supabaseUrl: "",
      supabaseServiceRoleKey: "",
    };
  }
}

export async function updateMarketplaceConfig(marketplace: string, enabled: boolean) {
  // TODO: Wire up to Supabase marketplace_config table
  return {
    success: true,
    marketplace,
    enabled,
  };
}
