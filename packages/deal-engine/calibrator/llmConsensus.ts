/**
 * LLM Consensus Module
 * Detects agreement/disagreement between multiple AI models
 * Implements ensemble reliability scoring
 */

import type { LLMClassification } from "../types/DealScore.js";

export interface ConsensusResult {
  consensusScore: number; // 0-1, higher = more agreement
  disagreementLevel: "low" | "medium" | "high";
  meanScore: number;
  scoreVariance: number;
  recommendedAdjustment: number; // penalty/boost to apply
  reasoning: string;
}

export interface MultiModelScores {
  deepseek?: LLMClassification;
  openai?: LLMClassification;
  fallback?: LLMClassification;
}

/**
 * Calculate consensus between two AI models
 */
export function calculateConsensus(
  scoreA: number,
  scoreB: number
): { consensusScore: number; disagreementLevel: "low" | "medium" | "high" } {
  // Consensus is inverse of normalized absolute difference
  const difference = Math.abs(scoreA - scoreB);
  const consensusScore = Math.max(0, 1 - difference / 100);

  let disagreementLevel: "low" | "medium" | "high";
  if (consensusScore >= 0.8) {
    disagreementLevel = "low"; // strong agreement
  } else if (consensusScore >= 0.4) {
    disagreementLevel = "medium"; // moderate disagreement
  } else {
    disagreementLevel = "high"; // strong disagreement
  }

  return { consensusScore, disagreementLevel };
}

/**
 * Multi-model consensus analyzer
 */
export function analyzeConsensus(models: MultiModelScores): ConsensusResult {
  const scores: number[] = [];
  const providers: string[] = [];

  if (models.deepseek) {
    scores.push(models.deepseek.score);
    providers.push("deepseek");
  }
  if (models.openai) {
    scores.push(models.openai.score);
    providers.push("openai");
  }
  if (models.fallback) {
    scores.push(models.fallback.score);
    providers.push("fallback");
  }

  if (scores.length === 0) {
    throw new Error("No model scores provided");
  }

  // Single model - no consensus possible
  if (scores.length === 1) {
    return {
      consensusScore: 0.5, // neutral
      disagreementLevel: "medium",
      meanScore: scores[0],
      scoreVariance: 0,
      recommendedAdjustment: 0,
      reasoning: "Single model evaluation - no consensus check available",
    };
  }

  // Calculate mean and variance
  const meanScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const scoreVariance =
    scores.reduce((sum, s) => sum + Math.pow(s - meanScore, 2), 0) / scores.length;

  // Calculate pairwise consensus
  const pairwiseScores: number[] = [];
  for (let i = 0; i < scores.length; i++) {
    for (let j = i + 1; j < scores.length; j++) {
      const { consensusScore } = calculateConsensus(scores[i], scores[j]);
      pairwiseScores.push(consensusScore);
    }
  }

  const avgConsensus =
    pairwiseScores.reduce((sum, c) => sum + c, 0) / pairwiseScores.length;

  // Determine disagreement level
  let disagreementLevel: "low" | "medium" | "high";
  if (avgConsensus >= 0.8) {
    disagreementLevel = "low";
  } else if (avgConsensus >= 0.4) {
    disagreementLevel = "medium";
  } else {
    disagreementLevel = "high";
  }

  // Calculate recommended adjustment
  let recommendedAdjustment = 0;
  let reasoning = "";

  if (disagreementLevel === "low") {
    // High agreement - boost reliability
    recommendedAdjustment = 5;
    reasoning = `Strong consensus (${(avgConsensus * 100).toFixed(1)}%) across ${providers.join(" + ")}. Confidence boost applied.`;
  } else if (disagreementLevel === "medium") {
    // Moderate disagreement - neutral
    recommendedAdjustment = 0;
    reasoning = `Moderate consensus (${(avgConsensus * 100).toFixed(1)}%) across ${providers.join(" + ")}. No adjustment applied.`;
  } else {
    // High disagreement - apply risk penalty
    recommendedAdjustment = -12;
    reasoning = `Low consensus (${(avgConsensus * 100).toFixed(1)}%) across ${providers.join(" + ")}. Risk penalty applied due to model disagreement.`;
  }

  // Additional penalty for high variance
  if (scoreVariance > 400) {
    // std > 20
    recommendedAdjustment -= 8;
    reasoning += " High variance detected.";
  }

  return {
    consensusScore: avgConsensus,
    disagreementLevel,
    meanScore,
    scoreVariance,
    recommendedAdjustment,
    reasoning,
  };
}

/**
 * Risk-level consensus check
 * Validates if models agree on risk classification
 */
export function checkRiskConsensus(
  models: MultiModelScores
): {
  agreement: boolean;
  dominantRisk: "green" | "amber" | "red";
  confidence: number;
} {
  const riskLevels: Array<"green" | "amber" | "red"> = [];

  if (models.deepseek) riskLevels.push(models.deepseek.riskLevel);
  if (models.openai) riskLevels.push(models.openai.riskLevel);
  if (models.fallback) riskLevels.push(models.fallback.riskLevel);

  if (riskLevels.length === 0) {
    return { agreement: false, dominantRisk: "amber", confidence: 0 };
  }

  // Count occurrences
  const counts = {
    green: riskLevels.filter((r) => r === "green").length,
    amber: riskLevels.filter((r) => r === "amber").length,
    red: riskLevels.filter((r) => r === "red").length,
  };

  // Find dominant risk level
  const dominantRisk = (
    Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]
  ) as "green" | "amber" | "red";

  // Agreement if all models match
  const agreement = riskLevels.every((r) => r === dominantRisk);

  // Confidence based on majority
  const confidence = counts[dominantRisk] / riskLevels.length;

  return { agreement, dominantRisk, confidence };
}

/**
 * Confidence-weighted ensemble
 * Weighs models by their individual confidence scores
 */
export function confidenceWeightedScore(models: MultiModelScores): number {
  const weightedScores: Array<{ score: number; weight: number }> = [];

  if (models.deepseek) {
    weightedScores.push({
      score: models.deepseek.score,
      weight: models.deepseek.confidence / 100,
    });
  }
  if (models.openai) {
    weightedScores.push({
      score: models.openai.score,
      weight: models.openai.confidence / 100,
    });
  }
  if (models.fallback) {
    weightedScores.push({
      score: models.fallback.score,
      weight: models.fallback.confidence / 100,
    });
  }

  if (weightedScores.length === 0) return 50; // neutral default

  const totalWeight = weightedScores.reduce((sum, s) => sum + s.weight, 0);

  if (totalWeight === 0) return 50;

  const weightedMean = weightedScores.reduce(
    (sum, s) => sum + (s.score * s.weight) / totalWeight,
    0
  );

  return weightedMean;
}
