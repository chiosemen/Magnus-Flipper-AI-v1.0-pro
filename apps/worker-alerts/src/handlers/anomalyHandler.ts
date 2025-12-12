import { prisma } from "../services/prisma";
import { logger } from "../utils/logger";
import { config } from "../config";

export interface Anomaly {
  marketplace: string;
  errorCode: string | null;
  errorMessage: string | null;
  count: number;
  recentRuns: Array<{
    id: string;
    createdAt: Date;
    errorCode: string | null;
    errorMessage: string | null;
  }>;
}

export async function detectAnomalies(): Promise<Anomaly[]> {
  const pollIntervalMs = config.pollIntervalMs;
  const timeWindow = new Date(Date.now() - pollIntervalMs * 2); // Look back 2x poll interval

  // Query recent scrape runs
  const recentRuns = await prisma.scrapeRun.findMany({
    where: {
      createdAt: {
        gte: timeWindow,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });

  // Group by marketplace and error patterns
  const marketplaceGroups = new Map<string, Anomaly>();

  for (const run of recentRuns) {
    if (!run.success) {
      const key = `${run.marketplace}:${run.errorCode || "UNKNOWN"}`;
      
      if (!marketplaceGroups.has(key)) {
        marketplaceGroups.set(key, {
          marketplace: run.marketplace,
          errorCode: run.errorCode,
          errorMessage: run.errorMessage,
          count: 0,
          recentRuns: [],
        });
      }

      const anomaly = marketplaceGroups.get(key)!;
      anomaly.count++;
      anomaly.recentRuns.push({
        id: run.id,
        createdAt: run.createdAt,
        errorCode: run.errorCode,
        errorMessage: run.errorMessage,
      });
    }
  }

  // Filter anomalies: only return those with significant error rates
  const anomalies: Anomaly[] = [];
  const marketplaceTotals = new Map<string, number>();

  // Count total runs per marketplace
  for (const run of recentRuns) {
    const total = marketplaceTotals.get(run.marketplace) || 0;
    marketplaceTotals.set(run.marketplace, total + 1);
  }

  // Calculate error ratios and identify anomalies
  for (const anomaly of marketplaceGroups.values()) {
    const total = marketplaceTotals.get(anomaly.marketplace) || 1;
    const errorRatio = anomaly.count / total;

    // Consider it an anomaly if:
    // - Error ratio > 20% OR
    // - More than 5 errors in the time window
    if (errorRatio > 0.2 || anomaly.count >= 5) {
      anomalies.push(anomaly);
    }
  }

  if (anomalies.length > 0) {
    logger.warn(
      { count: anomalies.length, anomalies: anomalies.map((a) => `${a.marketplace}:${a.errorCode}`) },
      `⚠️ ${anomalies.length} anomalies detected`
    );
  }

  return anomalies;
}

export function calculateErrorRatios(recentRuns: any[]): Record<string, { errors: number; total: number }> {
  const ratios: Record<string, { errors: number; total: number }> = {};

  for (const run of recentRuns) {
    if (!ratios[run.marketplace]) {
      ratios[run.marketplace] = { errors: 0, total: 0 };
    }
    ratios[run.marketplace].total++;
    if (!run.success) {
      ratios[run.marketplace].errors++;
    }
  }

  return ratios;
}
