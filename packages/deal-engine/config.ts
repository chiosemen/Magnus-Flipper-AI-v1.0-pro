/**
 * Deal Engine Configuration
 * Environment-driven settings for AI classifiers and scoring
 */

export interface DealEngineConfig {
  // AI Provider settings
  preferredProvider: "deepseek" | "openai";
  deepseekApiKey: string;
  deepseekApiUrl: string;
  openaiApiKey: string;
  openaiModel: string;

  // Failover settings
  maxRetries: number;
  retryDelayMs: number;
  failoverThreshold: number; // failures in 60s before switching
  failoverWindowMs: number;

  // Scoring weights
  llmWeight: number;
  baselineWeight: number;
  demandWeight: number;

  // Timeouts
  llmTimeoutMs: number;

  // Bias correction
  optimismPenalty: number; // reduce score if LLM is too optimistic

  // Caching
  cacheTTLSeconds: number;
  enableCache: boolean;

  // Rate limiting per tier
  tierLimits: {
    FREE: { dailyScores: number; maxConcurrent: number };
    PRO: { dailyScores: number; maxConcurrent: number };
    AGENCY: { dailyScores: number; maxConcurrent: number };
    ADMIN: { dailyScores: number; maxConcurrent: number };
  };

  // Supabase
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): DealEngineConfig {
  const preferredProvider =
    (process.env.PREFERRED_AI_PROVIDER as "deepseek" | "openai") || "deepseek";

  return {
    // AI Providers
    preferredProvider,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY || "",
    deepseekApiUrl:
      process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions",
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o",

    // Failover
    maxRetries: parseInt(process.env.AI_MAX_RETRIES || "3"),
    retryDelayMs: parseInt(process.env.AI_RETRY_DELAY_MS || "1000"),
    failoverThreshold: parseInt(process.env.AI_FAILOVER_THRESHOLD || "3"),
    failoverWindowMs: parseInt(process.env.AI_FAILOVER_WINDOW_MS || "60000"),

    // Scoring weights
    llmWeight: parseFloat(process.env.LLM_WEIGHT || "0.55"),
    baselineWeight: parseFloat(process.env.BASELINE_WEIGHT || "0.25"),
    demandWeight: parseFloat(process.env.DEMAND_WEIGHT || "0.20"),

    // Timeouts
    llmTimeoutMs: parseInt(process.env.LLM_TIMEOUT_MS || "30000"),

    // Bias correction
    optimismPenalty: parseFloat(process.env.OPTIMISM_PENALTY || "0.85"),

    // Caching
    cacheTTLSeconds: parseInt(process.env.DEAL_SCORE_CACHE_TTL || "3600"),
    enableCache: process.env.ENABLE_DEAL_SCORE_CACHE !== "false",

    // Tier limits
    tierLimits: {
      FREE: {
        dailyScores: parseInt(process.env.FREE_DAILY_SCORES || "10"),
        maxConcurrent: 1,
      },
      PRO: {
        dailyScores: parseInt(process.env.PRO_DAILY_SCORES || "100"),
        maxConcurrent: 3,
      },
      AGENCY: {
        dailyScores: parseInt(process.env.AGENCY_DAILY_SCORES || "1000"),
        maxConcurrent: 10,
      },
      ADMIN: {
        dailyScores: -1, // unlimited
        maxConcurrent: 20,
      },
    },

    // Supabase
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: DealEngineConfig): void {
  const errors: string[] = [];

  if (!config.deepseekApiKey && !config.openaiApiKey) {
    errors.push("At least one AI provider API key must be configured");
  }

  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    errors.push("Supabase credentials are required");
  }

  if (
    config.llmWeight + config.baselineWeight + config.demandWeight !==
    1.0
  ) {
    errors.push("Scoring weights must sum to 1.0");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
  }
}

/**
 * Default configuration instance
 */
export const defaultConfig = loadConfig();
