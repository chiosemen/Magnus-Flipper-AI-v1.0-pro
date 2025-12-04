import { z } from "zod";

/**
 * AI Provider types
 */
export type AIProvider = "deepseek" | "openai" | "fallback";

/**
 * Risk level classification
 */
export type RiskLevel = "green" | "amber" | "red";

/**
 * Deal Score schema returned by AI classifiers
 */
export const DealScoreSchema = z.object({
  // Provider information
  aiProvider: z.enum(["deepseek", "openai", "fallback"]),

  // Core scores (0-100)
  confidence: z.number().min(0).max(100),
  fairValue: z.number().min(0),
  profitPotential: z.number().min(0).max(100),
  conditionAdjustment: z.number().min(-50).max(50),
  marketDemand: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100),

  // Risk assessment
  riskLevel: z.enum(["green", "amber", "red"]),
  riskFactors: z.array(z.string()).optional(),

  // LLM reasoning
  reasoning: z.string(),

  // Performance metrics
  latencyMs: z.number().optional(),
  tokensUsed: z.number().optional(),

  // Timestamps
  scoredAt: z.string().optional(),
});

export type DealScore = z.infer<typeof DealScoreSchema>;

/**
 * Extended deal score with additional metadata
 */
export interface DealScoreResult extends DealScore {
  listingId: string;
  userId?: string;
  tier?: string;
  cached?: boolean;
}

/**
 * Statistical baseline score
 */
export interface BaselineScore {
  priceVsMarket: number; // -100 to 100 (negative = below market)
  priceVsMSRP: number; // percentage below/above MSRP
  categoryDemand: number; // 0-100
  conditionPremium: number; // adjustment based on condition
  overallBaseline: number; // 0-100
}

/**
 * LLM Classification Result
 */
export interface LLMClassification {
  provider: AIProvider;
  score: number;
  confidence: number;
  reasoning: string;
  fairValueEstimate: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  latencyMs: number;
  tokensUsed?: number;
}

/**
 * Composite score breakdown
 */
export interface ScoreBreakdown {
  llmScore: number;
  llmWeight: number;
  baselineScore: number;
  baselineWeight: number;
  demandScore: number;
  demandWeight: number;
  finalScore: number;
  components: {
    aiAnalysis: LLMClassification;
    statistical: BaselineScore;
  };
}

/**
 * Deal evaluation request
 */
export interface EvaluationRequest {
  listing: {
    id: string;
    title: string;
    price: number;
    category?: string;
    condition?: string;
    description?: string;
  };
  userId?: string;
  tier?: string;
  forceRefresh?: boolean;
}

/**
 * Deal evaluation response
 */
export interface EvaluationResponse {
  success: boolean;
  score?: DealScore;
  breakdown?: ScoreBreakdown;
  cached?: boolean;
  error?: string;
}
