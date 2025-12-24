// apps/web/src/lib/admin/marketplace.ts

/**
 * Marketplace configuration integration
 * Local implementation (deal-engine package not available in web build)
 */

export interface DealEngineConfig {
  preferredProvider: "deepseek" | "openai";
  deepseekApiKey: string;
  deepseekApiUrl: string;
  openaiApiKey: string;
  openaiModel: string;
  maxRetries: number;
  retryDelayMs: number;
  failoverThreshold: number;
  failoverWindowMs: number;
  llmWeight: number;
  baselineWeight: number;
  demandWeight: number;
  llmTimeoutMs: number;
  optimismPenalty: number;
  cacheTTLSeconds: number;
  enableCache: boolean;
  tierLimits: {
    FREE: { dailyScores: number; maxConcurrent: number };
    PRO: { dailyScores: number; maxConcurrent: number };
    AGENCY: { dailyScores: number; maxConcurrent: number };
    ADMIN: { dailyScores: number; maxConcurrent: number };
  };
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

function loadConfig(): DealEngineConfig {
  return {
    preferredProvider: (process.env.PREFERRED_AI_PROVIDER as "deepseek" | "openai") || "deepseek",
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
    deepseekApiUrl: process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || "3"),
    retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || "1000"),
    failoverThreshold: parseInt(process.env.AI_FAILOVER_THRESHOLD || "3"),
    failoverWindowMs: parseInt(process.env.AI_FAILOVER_WINDOW_MS || "60000"),
    llmWeight: parseFloat(process.env.LLM_WEIGHT || "0.55"),
    baselineWeight: parseFloat(process.env.BASELINE_WEIGHT || "0.25"),
    demandWeight: parseFloat(process.env.DEMAND_WEIGHT || "0.20"),
    llmTimeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || "30000"),
    optimismPenalty: parseFloat(process.env.OPTIMISM_PENALTY || "0.85"),
    cacheTTLSeconds: parseInt(process.env.DEAL_SCORE_CACHE_TTL || "3600"),
    enableCache: process.env.ENABLE_DEAL_SCORE_CACHE !== "false",
    tierLimits: {
      FREE: { dailyScores: parseInt(process.env.FREE_DAILY_SCORES || "10"), maxConcurrent: 1 },
      PRO: { dailyScores: parseInt(process.env.PRO_DAILY_SCORES || "100"), maxConcurrent: 3 },
      AGENCY: { dailyScores: parseInt(process.env.AGENCY_DAILY_SCORES || "1000"), maxConcurrent: 10 },
      ADMIN: { dailyScores: -1, maxConcurrent: 20 },
    },
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

export async function fetchMarketplaceConfig(): Promise<DealEngineConfig> {
  try {
    // Load configuration from environment variables
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
