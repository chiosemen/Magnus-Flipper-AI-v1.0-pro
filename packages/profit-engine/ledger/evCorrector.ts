/**
 * Expected Value (EV) Correction Engine
 * Learning loop that improves resale predictions over time
 */

import { createClient, SupabaseClient } from "@getSupabaseClient()/getSupabaseClient()-js";
import type { EVCorrection, HistoricalStats, FinalizedSale } from "../schemas/SaleEvent.js";

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)"
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

/**
 * Correct EV based on actual sale outcome
 * This creates a learning loop for the AI deal classifier
 */
export async function correctEV(
  sale: FinalizedSale,
  originalEvaluation: any
): Promise<EVCorrection> {
  const expectedValue = originalEvaluation?.resale_estimation || sale.salePrice;
  const actualValue = sale.salePrice;
  const variance = actualValue - expectedValue;
  const variancePercent =
    expectedValue > 0 ? (variance / expectedValue) * 100 : 0;

  // Get original confidence from evaluation
  const originalConfidence = originalEvaluation?.confidence || 50;

  // Calculate Bayesian correction factor
  const correctionFactor = await calculateBayesianCorrection(
    expectedValue,
    actualValue,
    originalConfidence,
    sale.marketplace,
    await getCategoryFromInventory(sale.inventoryItemId)
  );

  // Calculate learning weight (higher variance = higher weight)
  const learningWeight = calculateLearningWeight(
    variancePercent,
    originalConfidence
  );

  // Create correction record
  const correction: EVCorrection = {
    id: `ev_corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    saleId: sale.id,
    inventoryItemId: sale.inventoryItemId,
    category: await getCategoryFromInventory(sale.inventoryItemId),
    marketplace: sale.marketplace,
    expectedValue,
    actualValue,
    variance,
    variancePercent,
    originalConfidence,
    correctionFactor,
    learningWeight,
    createdAt: new Date().toISOString(),
    metadata: {
      holdingTime: sale.holdingTime,
      roi: sale.roi,
      originalEvaluation,
    },
  };

  // Store correction in database
  await getSupabaseClient().from("ev_corrections").insert({
    id: correction.id,
    sale_id: correction.saleId,
    inventory_item_id: correction.inventoryItemId,
    category: correction.category,
    marketplace: correction.marketplace,
    expected_value: correction.expectedValue,
    actual_value: correction.actualValue,
    variance: correction.variance,
    variance_percent: correction.variancePercent,
    original_confidence: correction.originalConfidence,
    correction_factor: correction.correctionFactor,
    learning_weight: correction.learningWeight,
    created_at: correction.createdAt,
    metadata: correction.metadata,
  });

  // Update historical stats
  await updateHistoricalStats(
    correction.category,
    correction.marketplace,
    correction
  );

  return correction;
}

/**
 * Calculate Bayesian correction factor
 * Uses conjugate priors to update beliefs about value accuracy
 */
async function calculateBayesianCorrection(
  expectedValue: number,
  actualValue: number,
  confidence: number,
  marketplace: string,
  category: string
): Promise<number> {
  // Get historical stats for this category/marketplace
  const stats = await getHistoricalStats(category, marketplace);

  if (!stats || stats.sampleSize < 5) {
    // Not enough data - use simple correction
    return actualValue / expectedValue;
  }

  // Bayesian update
  // Prior: Historical average variance
  const priorMean = stats.avgVariance;
  const priorVariance = Math.pow(stats.stdDeviation, 2);

  // Observation: Current variance
  const observedVariance = actualValue - expectedValue;

  // Posterior calculation (conjugate normal-normal update)
  const priorPrecision = 1 / priorVariance;
  const observedPrecision = confidence / 10000; // Convert confidence to precision

  const posteriorPrecision = priorPrecision + observedPrecision;
  const posteriorMean =
    (priorPrecision * priorMean + observedPrecision * observedVariance) /
    posteriorPrecision;

  // Correction factor incorporates both prior and current observation
  const correctedExpectedValue = expectedValue + posteriorMean;
  const correctionFactor = correctedExpectedValue / expectedValue;

  // Clamp correction factor to reasonable bounds (0.5x to 2x)
  return Math.max(0.5, Math.min(2.0, correctionFactor));
}

/**
 * Calculate learning weight based on variance and confidence
 * Higher variance + lower confidence = higher learning weight
 */
function calculateLearningWeight(
  variancePercent: number,
  originalConfidence: number
): number {
  // Absolute variance contribution (0-1)
  const absVariance = Math.abs(variancePercent);
  const varianceComponent = Math.min(1.0, absVariance / 100);

  // Confidence inverse contribution (0-1)
  const confidenceComponent = 1 - originalConfidence / 100;

  // Combined weight (higher variance and lower confidence = more weight)
  const weight = (varianceComponent * 0.6 + confidenceComponent * 0.4) * 100;

  return Math.round(weight);
}

/**
 * Get historical stats for category/marketplace
 */
async function getHistoricalStats(
  category: string,
  marketplace: string
): Promise<HistoricalStats | null> {
  const { data, error } = await getSupabaseClient()
    .from("historical_stats")
    .select("*")
    .eq("category", category)
    .eq("marketplace", marketplace)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    category: data.category,
    marketplace: data.marketplace,
    avgExpectedValue: data.avg_expected_value,
    avgActualValue: data.avg_actual_value,
    avgVariance: data.avg_variance,
    stdDeviation: data.std_deviation,
    sampleSize: data.sample_size,
    lastUpdated: data.last_updated,
  };
}

/**
 * Update historical stats with new correction
 */
async function updateHistoricalStats(
  category: string,
  marketplace: string,
  correction: EVCorrection
): Promise<void> {
  const stats = await getHistoricalStats(category, marketplace);

  if (!stats) {
    // Create initial stats
    await getSupabaseClient().from("historical_stats").insert({
      category,
      marketplace,
      avg_expected_value: correction.expectedValue,
      avg_actual_value: correction.actualValue,
      avg_variance: correction.variance,
      std_deviation: 0,
      sample_size: 1,
      last_updated: new Date().toISOString(),
    });
  } else {
    // Update stats using incremental mean/variance formulas
    const n = stats.sampleSize;
    const newN = n + 1;

    // Update average expected value
    const newAvgExpected =
      (stats.avgExpectedValue * n + correction.expectedValue) / newN;

    // Update average actual value
    const newAvgActual =
      (stats.avgActualValue * n + correction.actualValue) / newN;

    // Update average variance
    const newAvgVariance = (stats.avgVariance * n + correction.variance) / newN;

    // Update standard deviation (Welford's online algorithm)
    const delta = correction.variance - stats.avgVariance;
    const delta2 = correction.variance - newAvgVariance;
    const m2 = Math.pow(stats.stdDeviation, 2) * n + delta * delta2;
    const newStdDev = Math.sqrt(m2 / newN);

    await getSupabaseClient()
      .from("historical_stats")
      .update({
        avg_expected_value: newAvgExpected,
        avg_actual_value: newAvgActual,
        avg_variance: newAvgVariance,
        std_deviation: newStdDev,
        sample_size: newN,
        last_updated: new Date().toISOString(),
      })
      .eq("category", category)
      .eq("marketplace", marketplace);
  }
}

/**
 * Get category from inventory item
 */
async function getCategoryFromInventory(
  inventoryItemId: string
): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .from("inventory")
    .select("category")
    .eq("id", inventoryItemId)
    .single();

  if (error || !data) {
    return "unknown";
  }

  return data.category || "unknown";
}

/**
 * Get correction insights for a category/marketplace
 */
export async function getCorrectionInsights(
  category: string,
  marketplace: string
): Promise<{
  stats: HistoricalStats | null;
  recentCorrections: EVCorrection[];
  overallAccuracy: number;
  recommendedAdjustment: number;
}> {
  const stats = await getHistoricalStats(category, marketplace);

  // Get recent corrections (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: corrections } = await getSupabaseClient()
    .from("ev_corrections")
    .select("*")
    .eq("category", category)
    .eq("marketplace", marketplace)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(20);

  const recentCorrections: EVCorrection[] =
    corrections?.map((c) => ({
      id: c.id,
      saleId: c.sale_id,
      inventoryItemId: c.inventory_item_id,
      category: c.category,
      marketplace: c.marketplace,
      expectedValue: c.expected_value,
      actualValue: c.actual_value,
      variance: c.variance,
      variancePercent: c.variance_percent,
      originalConfidence: c.original_confidence,
      correctionFactor: c.correction_factor,
      learningWeight: c.learning_weight,
      createdAt: c.created_at,
      metadata: c.metadata,
    })) || [];

  // Calculate overall accuracy
  let overallAccuracy = 100;
  if (stats && stats.avgExpectedValue > 0) {
    const mape = Math.abs(stats.avgVariance) / stats.avgExpectedValue;
    overallAccuracy = Math.max(0, (1 - mape) * 100);
  }

  // Calculate recommended adjustment multiplier
  let recommendedAdjustment = 1.0;
  if (stats && stats.sampleSize >= 10) {
    recommendedAdjustment = stats.avgActualValue / stats.avgExpectedValue;
    // Clamp to reasonable bounds
    recommendedAdjustment = Math.max(0.7, Math.min(1.3, recommendedAdjustment));
  }

  return {
    stats,
    recentCorrections,
    overallAccuracy,
    recommendedAdjustment,
  };
}

/**
 * Apply EV correction to future predictions
 * This function adjusts AI predictions based on historical accuracy
 */
export async function applyEVCorrection(
  rawPrediction: number,
  category: string,
  marketplace: string,
  confidence: number
): Promise<{
  correctedPrediction: number;
  adjustmentFactor: number;
  confidenceAdjustment: number;
}> {
  const insights = await getCorrectionInsights(category, marketplace);

  let adjustmentFactor = insights.recommendedAdjustment;
  let confidenceAdjustment = 0;

  // High accuracy = confidence boost
  if (insights.overallAccuracy > 90) {
    confidenceAdjustment = 5;
  } else if (insights.overallAccuracy > 75) {
    confidenceAdjustment = 0;
  } else if (insights.overallAccuracy > 60) {
    confidenceAdjustment = -5;
  } else {
    confidenceAdjustment = -10;
  }

  // Apply Bayesian shrinkage if sample size is small
  if (insights.stats && insights.stats.sampleSize < 20) {
    const shrinkageFactor = insights.stats.sampleSize / 20;
    adjustmentFactor = 1.0 + (adjustmentFactor - 1.0) * shrinkageFactor;
  }

  const correctedPrediction = rawPrediction * adjustmentFactor;

  return {
    correctedPrediction,
    adjustmentFactor,
    confidenceAdjustment,
  };
}

/**
 * Get all historical stats (for admin dashboard)
 */
export async function getAllHistoricalStats(): Promise<HistoricalStats[]> {
  const { data, error } = await getSupabaseClient()
    .from("historical_stats")
    .select("*")
    .order("sample_size", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((stat) => ({
    category: stat.category,
    marketplace: stat.marketplace,
    avgExpectedValue: stat.avg_expected_value,
    avgActualValue: stat.avg_actual_value,
    avgVariance: stat.avg_variance,
    stdDeviation: stat.std_deviation,
    sampleSize: stat.sample_size,
    lastUpdated: stat.last_updated,
  }));
}

/**
 * Calculate model accuracy metrics
 */
export async function calculateModelAccuracy(): Promise<{
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Squared Error
  r2: number; // R-squared
  sampleSize: number;
}> {
  const { data: corrections } = await getSupabaseClient()
    .from("ev_corrections")
    .select("expected_value, actual_value")
    .limit(1000);

  if (!corrections || corrections.length === 0) {
    return { mape: 0, rmse: 0, r2: 0, sampleSize: 0 };
  }

  const n = corrections.length;
  let sumSquaredError = 0;
  let sumAbsPercentError = 0;
  let sumActual = 0;

  for (const corr of corrections) {
    const error = corr.actual_value - corr.expected_value;
    sumSquaredError += error * error;
    sumAbsPercentError +=
      Math.abs(error) / Math.max(1, corr.actual_value);
    sumActual += corr.actual_value;
  }

  const mape = (sumAbsPercentError / n) * 100;
  const rmse = Math.sqrt(sumSquaredError / n);

  // Calculate R-squared
  const meanActual = sumActual / n;
  let sumSquaredTotal = 0;
  for (const corr of corrections) {
    sumSquaredTotal += Math.pow(corr.actual_value - meanActual, 2);
  }

  const r2 = sumSquaredTotal > 0 ? 1 - sumSquaredError / sumSquaredTotal : 0;

  return {
    mape,
    rmse,
    r2,
    sampleSize: n,
  };
}
