/**
 * Trend Detector
 * Detects improving/degrading trends in marketplace health
 */

import { getSupabaseClient } from '../services/supabase';
import { logger } from '../utils/logger';

const MARKETPLACES = ['facebook', 'craigslist', 'ebay', 'offerup', 'vinted', 'gumtree'];

export interface TrendAnalysis {
  marketplace: string;
  trend: 'improving' | 'stable' | 'degrading';
  currentScore: number;
  previousScore: number;
  change: number;
}

/**
 * Detect trends for all marketplaces
 */
export async function detectTrends(): Promise<void> {
  logger.info('Starting trend detection');

  for (const marketplace of MARKETPLACES) {
    try {
      const trend = await analyzeTrend(marketplace);
      
      if (trend.trend !== 'stable') {
        logger.info(
          {
            marketplace: trend.marketplace,
            trend: trend.trend,
            currentScore: trend.currentScore,
            previousScore: trend.previousScore,
            change: trend.change,
          },
          `Trend detected for ${marketplace}`
        );
      }
    } catch (error) {
      logger.error({ error, marketplace }, `Error detecting trend for ${marketplace}`);
    }
  }
}

/**
 * Analyze trend for a single marketplace
 */
async function analyzeTrend(marketplace: string): Promise<TrendAnalysis> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    logger.warn({ marketplace }, 'Supabase not configured for trend analysis');
    return {
      marketplace,
      trend: 'stable',
      currentScore: 100,
      previousScore: 100,
      change: 0,
    };
  }

  const now = Date.now();
  const last12h = new Date(now - 12 * 60 * 60 * 1000);
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const prev12h = new Date(now - 36 * 60 * 60 * 1000);

  // Get runs from last 12h
  const { data: recentRuns } = await supabase
    .from('scrape_runs')
    .select('*')
    .eq('marketplace', marketplace)
    .gte('created_at', last12h.toISOString())
    .lt('created_at', new Date(now).toISOString());

  // Get runs from previous 12h
  const { data: previousRuns } = await supabase
    .from('scrape_runs')
    .select('*')
    .eq('marketplace', marketplace)
    .gte('created_at', prev12h.toISOString())
    .lt('created_at', last12h.toISOString());

  // Calculate scores
  const currentScore = calculateScore(recentRuns || []);
  const previousScore = calculateScore(previousRuns || []);

  const change = currentScore - previousScore;
  
  let trend: 'improving' | 'stable' | 'degrading' = 'stable';
  if (change > 10) trend = 'improving';
  else if (change < -10) trend = 'degrading';

  return {
    marketplace,
    trend,
    currentScore,
    previousScore,
    change,
  };
}

/**
 * Calculate simple health score from runs
 */
function calculateScore(runs: any[]): number {
  if (runs.length === 0) return 100; // No data = assume healthy

  const successRate = runs.filter(r => r.success).length / runs.length;
  return Math.round(successRate * 100);
}
