/**
 * Calibration Orchestrator
 * Final calibration pipeline for financial-grade deal scoring
 */

import type { DealScore } from "../types/DealScore.js";
import { calculateBayesianPosterior, quickBayesianUpdate } from "./bayesian.js";
import { analyzeConsensus, type MultiModelScores, type ConsensusResult } from "./llmConsensus.js";

export interface HistoricalStats {
  avgError: number; // mean absolute error from historical predictions
  stdError: number; // standard deviation of error
  sampleSize: number; // number of historical samples
  avgScore: number; // historical mean score
}

export interface CalibrationInputs {
  rawScore: DealScore;
  historicalStats?: HistoricalStats;
  consensus?: ConsensusResult;
  marketVolatilityIndex?: number; // 0-1, higher = more volatile
  multiModelScores?: MultiModelScores;
}

export interface CalibratedScore {
  calibratedScore: number;
  originalScore: number;
  confidence: number; // 0-1
  reliability: "low" | "medium" | "high";
  adjustments: {
    bayesianAdjustment: number;
    consensusAdjustment: number;
    volatilityDampening: number;
    pessimismPenalty: number;
    totalAdjustment: number;
  };
  reasoning: string;
  credibleInterval?: { lower: number; upper: number };
}

/**
 * Apply asymmetric pessimism penalty
 * Protects against hallucinated/over-optimistic flips
 */
function applyPessimismPenalty(
  score: number,
  consensus?: ConsensusResult,
  volatility: number = 0
): number {
  let penalty = 0;
  let reasons: string[] = [];

  // High score with low consensus = suspicious
  if (score > 75 && consensus && consensus.disagreementLevel !== "low") {
    penalty += 12;
    reasons.push("High score with low model consensus");
  }

  // Very high score with high volatility = risky
  if (score > 80 && volatility > 0.7) {
    penalty += 10;
    reasons.push("High score in volatile market");
  }

  // Extreme scores are rare - be skeptical
  if (score > 90) {
    penalty += 8;
    reasons.push("Extremely high score - applying skepticism penalty");
  }

  return penalty;
}

/**
 * Apply volatility dampening
 * Reduces score confidence in volatile markets
 */
function applyVolatilityDampening(
  score: number,
  volatility: number
): { dampenedScore: number; dampening: number } {
  if (volatility <= 0) {
    return { dampenedScore: score, dampening: 0 };
  }

  // Dampening increases with volatility
  let dampeningFactor = 1.0;

  if (volatility > 0.7) {
    dampeningFactor = 0.92; // -8%
  } else if (volatility > 0.5) {
    dampeningFactor = 0.96; // -4%
  } else if (volatility > 0.3) {
    dampeningFactor = 0.98; // -2%
  }

  const dampenedScore = score * dampeningFactor;
  const dampening = score - dampenedScore;

  return { dampenedScore, dampening };
}

/**
 * Main calibration function
 * Transforms raw AI score into financially trustworthy signal
 */
export function calibrate(inputs: CalibrationInputs): CalibratedScore {
  const {
    rawScore,
    historicalStats,
    consensus,
    marketVolatilityIndex = 0,
    multiModelScores,
  } = inputs;

  const originalScore = rawScore.overallScore;
  let calibratedScore = originalScore;

  // Track adjustments
  let bayesianAdjustment = 0;
  let consensusAdjustment = 0;
  let volatilityDampening = 0;
  let pessimismPenalty = 0;

  const reasoningParts: string[] = [];

  // Step 1: Bayesian adjustment
  if (historicalStats && historicalStats.sampleSize > 0) {
    const bayesianResult = calculateBayesianPosterior({
      priorMean: historicalStats.avgScore,
      priorVariance: Math.pow(historicalStats.stdError, 2),
      observedMean: calibratedScore,
      observedVariance: 100, // typical score variance
      sampleSize: historicalStats.sampleSize,
    });

    bayesianAdjustment = bayesianResult.posteriorMean - calibratedScore;
    calibratedScore = bayesianResult.posteriorMean;

    reasoningParts.push(
      `Bayesian update (${bayesianAdjustment > 0 ? "+" : ""}${bayesianAdjustment.toFixed(1)} pts, confidence: ${(bayesianResult.confidenceIndex * 100).toFixed(0)}%)`
    );
  } else {
    // Quick Bayesian if no historical data
    const quickBayesian = quickBayesianUpdate(calibratedScore);
    bayesianAdjustment = quickBayesian.posteriorMean - calibratedScore;
    calibratedScore = quickBayesian.posteriorMean;

    reasoningParts.push(
      `Quick Bayesian adjustment (${bayesianAdjustment > 0 ? "+" : ""}${bayesianAdjustment.toFixed(1)} pts)`
    );
  }

  // Step 2: Consensus weighting
  let consensusResult = consensus;
  if (!consensusResult && multiModelScores) {
    consensusResult = analyzeConsensus(multiModelScores);
  }

  if (consensusResult) {
    consensusAdjustment = consensusResult.recommendedAdjustment;
    calibratedScore += consensusAdjustment;

    reasoningParts.push(
      `Consensus ${consensusResult.disagreementLevel} (${consensusAdjustment > 0 ? "+" : ""}${consensusAdjustment} pts)`
    );
  }

  // Step 3: Volatility dampening
  const { dampenedScore, dampening } = applyVolatilityDampening(
    calibratedScore,
    marketVolatilityIndex
  );
  volatilityDampening = dampening;
  calibratedScore = dampenedScore;

  if (volatilityDampening > 0) {
    reasoningParts.push(`Volatility dampening (-${volatilityDampening.toFixed(1)} pts)`);
  }

  // Step 4: Asymmetric pessimism penalty
  pessimismPenalty = applyPessimismPenalty(
    calibratedScore,
    consensusResult,
    marketVolatilityIndex
  );
  calibratedScore -= pessimismPenalty;

  if (pessimismPenalty > 0) {
    reasoningParts.push(`Pessimism penalty (-${pessimismPenalty} pts)`);
  }

  // Clamp to 0-100
  calibratedScore = Math.max(0, Math.min(100, calibratedScore));

  // Calculate confidence
  const totalAdjustment = Math.abs(calibratedScore - originalScore);
  let confidence = rawScore.confidence / 100;

  // Reduce confidence if large adjustments were made
  if (totalAdjustment > 15) {
    confidence *= 0.8;
  } else if (totalAdjustment > 10) {
    confidence *= 0.9;
  }

  // Consensus affects confidence
  if (consensusResult) {
    confidence *= consensusResult.consensusScore;
  }

  // Volatility reduces confidence
  if (marketVolatilityIndex > 0.5) {
    confidence *= 0.9;
  }

  // Clamp confidence
  confidence = Math.max(0, Math.min(1, confidence));

  // Determine reliability
  let reliability: "low" | "medium" | "high";
  if (confidence >= 0.7) {
    reliability = "high";
  } else if (confidence >= 0.4) {
    reliability = "medium";
  } else {
    reliability = "low";
  }

  // Build reasoning
  const finalReasoning = `Calibrated from ${originalScore.toFixed(0)} � ${calibratedScore.toFixed(0)} (${totalAdjustment.toFixed(1)} pts total). ${reasoningParts.join("; ")}.`;

  return {
    calibratedScore,
    originalScore,
    confidence,
    reliability,
    adjustments: {
      bayesianAdjustment,
      consensusAdjustment,
      volatilityDampening,
      pessimismPenalty,
      totalAdjustment,
    },
    reasoning: finalReasoning,
  };
}

/**
 * Batch calibration for multiple scores
 */
export function calibrateBatch(
  scores: DealScore[],
  historicalStats?: HistoricalStats,
  marketVolatilityIndex: number = 0
): CalibratedScore[] {
  return scores.map((score) =>
    calibrate({
      rawScore: score,
      historicalStats,
      marketVolatilityIndex,
    })
  );
}
