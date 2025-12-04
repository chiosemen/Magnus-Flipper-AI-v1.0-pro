/**
 * Bayesian Posterior Estimator
 * Financial-grade confidence calibration using Bayesian inference
 */

export interface BayesianInputs {
  priorMean: number;
  priorVariance: number;
  observedMean: number;
  observedVariance: number;
  sampleSize: number;
}

export interface BayesianResult {
  posteriorMean: number;
  posteriorVariance: number;
  confidenceIndex: number;
  reliability: "low" | "medium" | "high";
}

/**
 * Maximum variance threshold for confidence normalization
 */
const MAX_VARIANCE = 1000;

/**
 * Calculate Bayesian posterior distribution
 *
 * Uses conjugate prior update for normal distribution:
 * posterior_variance = 1 / (1/prior_variance + n/observed_variance)
 * posterior_mean = posterior_variance * (prior_mean/prior_variance + n*observed_mean/observed_variance)
 */
export function calculateBayesianPosterior(inputs: BayesianInputs): BayesianResult {
  const { priorMean, priorVariance, observedMean, observedVariance, sampleSize } = inputs;

  // Prevent division by zero
  const safePriorVariance = Math.max(priorVariance, 0.01);
  const safeObservedVariance = Math.max(observedVariance, 0.01);

  // Calculate posterior variance (precision-weighted)
  const posteriorVariance =
    1 / (1 / safePriorVariance + sampleSize / safeObservedVariance);

  // Calculate posterior mean (weighted average)
  const posteriorMean =
    posteriorVariance *
    (priorMean / safePriorVariance + (sampleSize * observedMean) / safeObservedVariance);

  // Confidence index: lower variance = higher confidence
  // Normalized to 0-1 range
  const confidenceIndex = Math.max(0, Math.min(1, 1 - posteriorVariance / MAX_VARIANCE));

  // Classify reliability
  let reliability: "low" | "medium" | "high";
  if (confidenceIndex >= 0.7) {
    reliability = "high";
  } else if (confidenceIndex >= 0.4) {
    reliability = "medium";
  } else {
    reliability = "low";
  }

  return {
    posteriorMean,
    posteriorVariance,
    confidenceIndex,
    reliability,
  };
}

/**
 * Quick Bayesian update for real-time scoring
 * Assumes reasonable defaults for marketplace data
 */
export function quickBayesianUpdate(
  rawScore: number,
  historicalMean: number = 50,
  historicalSamples: number = 100
): BayesianResult {
  return calculateBayesianPosterior({
    priorMean: historicalMean,
    priorVariance: 200, // moderate uncertainty
    observedMean: rawScore,
    observedVariance: 100, // typical score variance
    sampleSize: Math.max(1, historicalSamples),
  });
}

/**
 * Multi-model Bayesian ensemble
 * Combines predictions from multiple models (DeepSeek + OpenAI)
 */
export function bayesianEnsemble(
  scores: number[],
  weights: number[] = [],
  variances: number[] = []
): BayesianResult {
  if (scores.length === 0) {
    throw new Error("No scores provided for ensemble");
  }

  // Default equal weights
  const normalizedWeights =
    weights.length === scores.length
      ? weights
      : scores.map(() => 1 / scores.length);

  // Default variances
  const normalizedVariances =
    variances.length === scores.length
      ? variances
      : scores.map(() => 100);

  // Precision-weighted mean
  const precisions = normalizedVariances.map((v) => 1 / Math.max(v, 0.01));
  const totalPrecision = precisions.reduce((sum, p) => sum + p, 0);

  const posteriorMean = scores.reduce(
    (sum, score, i) => sum + (score * precisions[i]) / totalPrecision,
    0
  );

  const posteriorVariance = 1 / totalPrecision;

  const confidenceIndex = Math.max(0, Math.min(1, 1 - posteriorVariance / MAX_VARIANCE));

  let reliability: "low" | "medium" | "high";
  if (confidenceIndex >= 0.7) {
    reliability = "high";
  } else if (confidenceIndex >= 0.4) {
    reliability = "medium";
  } else {
    reliability = "low";
  }

  return {
    posteriorMean,
    posteriorVariance,
    confidenceIndex,
    reliability,
  };
}

/**
 * Calculate credible interval (Bayesian confidence interval)
 */
export function credibleInterval(
  mean: number,
  variance: number,
  confidence: number = 0.95
): { lower: number; upper: number } {
  // For normal distribution, 95% CI is mean ± 1.96 * std
  const std = Math.sqrt(variance);
  const zScore = confidence === 0.95 ? 1.96 : confidence === 0.99 ? 2.58 : 1.64;

  return {
    lower: Math.max(0, mean - zScore * std),
    upper: Math.min(100, mean + zScore * std),
  };
}
