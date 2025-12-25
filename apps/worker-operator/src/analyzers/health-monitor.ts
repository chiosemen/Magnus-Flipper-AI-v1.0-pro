/**
 * Health Monitor
 * Calculates marketplace health scores and detects degradation
 */

import { getSupabaseClient } from '../services/supabase';
import { config } from '../config';
import { logger } from '../utils/logger';

const MARKETPLACES = ['facebook', 'craigslist', 'ebay', 'offerup', 'vinted', 'gumtree'];

export interface HealthScore {
  marketplace: string;
  score: number;
  successRate: number;
  anomalyRate: number;
  runCount: number;
  anomalyCount: number;
}

/**
 * Calculate health score for a marketplace
 */
async function calculateHealthScore(marketplace: string): Promise<HealthScore> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    logger.warn({ marketplace }, 'Supabase not configured for health scoring');
    return {
      marketplace,
      score: 100,
      successRate: 1.0,
      anomalyRate: 0.0,
      runCount: 0,
      anomalyCount: 0,
    };
  }

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Query runs
  const { data: runs, error: runsError } = await supabase
    .from('scrape_runs')
    .select('*')
    .eq('marketplace', marketplace)
    .gte('created_at', last24h.toISOString())
    .order('created_at', { ascending: false });

  if (runsError) {
    logger.error({ error: runsError, marketplace }, 'Error querying runs');
    throw runsError;
  }

  // Query anomalies
  const { data: anomalies, error: anomaliesError } = await supabase
    .from('scrape_anomalies')
    .select('*')
    .eq('marketplace', marketplace)
    .gte('created_at', last24h.toISOString());

  if (anomaliesError) {
    logger.error({ error: anomaliesError, marketplace }, 'Error querying anomalies');
    throw anomaliesError;
  }

  const runCount = runs?.length || 0;
  const anomalyCount = anomalies?.length || 0;

  if (runCount === 0) {
    // No data = assume healthy (but low confidence)
    return {
      marketplace,
      score: 100,
      successRate: 1.0,
      anomalyRate: 0.0,
      runCount: 0,
      anomalyCount: 0,
    };
  }

  const successRate = runs.filter(r => r.success).length / runCount;
  const anomalyRate = anomalyCount / runCount;

  // Weighted score: 70% success rate, 30% anomaly rate
  const score = Math.round((successRate * 70) + ((1 - Math.min(anomalyRate, 1)) * 30));

  return {
    marketplace,
    score,
    successRate,
    anomalyRate,
    runCount,
    anomalyCount,
  };
}

/**
 * Analyze health for all marketplaces
 */
export async function analyzeMarketplaceHealth(): Promise<void> {
  logger.info('Starting marketplace health analysis');

  for (const marketplace of MARKETPLACES) {
    try {
      const health = await calculateHealthScore(marketplace);

      logger.info(
        {
          marketplace: health.marketplace,
          score: health.score,
          successRate: health.successRate,
          anomalyRate: health.anomalyRate,
          runCount: health.runCount,
          anomalyCount: health.anomalyCount,
        },
        `Health score for ${marketplace}`
      );

      // Check if health is below threshold
      if (health.score < config.healthScoreThreshold && health.runCount > 0) {
        logger.warn(
          { marketplace: health.marketplace, score: health.score },
          `Marketplace ${marketplace} health degraded: ${health.score}/100`
        );

        // Optionally create change request (if auto-escalate enabled)
        if (config.autoEscalateEnabled) {
          await proposeMarketplaceDisable(marketplace, health);
        }
      }
    } catch (error) {
      logger.error({ error, marketplace }, `Error analyzing health for ${marketplace}`);
    }
  }
}

/**
 * Propose marketplace disable (creates change request, does not apply)
 */
async function proposeMarketplaceDisable(
  marketplace: string,
  health: HealthScore
): Promise<void> {
  // Check if there's already a pending proposal
  const { data: existing } = await supabase
    .from('operator_change_requests')
    .select('id')
    .eq('marketplace', marketplace)
    .eq('status', 'proposed')
    .eq('change_type', 'toggle_marketplace')
    .limit(1);

  if (existing && existing.length > 0) {
    logger.info({ marketplace }, 'Change request already exists, skipping');
    return;
  }

  // Create change request
  const { error } = await supabase
    .from('operator_change_requests')
    .insert({
      marketplace,
      change_type: 'toggle_marketplace',
      change_payload: {
        enabled: false,
      },
      rationale: `Marketplace health score ${health.score}/100 is below threshold ${config.healthScoreThreshold}. Success rate: ${(health.successRate * 100).toFixed(1)}%, Anomaly rate: ${(health.anomalyRate * 100).toFixed(1)}%`,
      risk_level: 'medium',
      hypothesis: `Disabling ${marketplace} will prevent wasted scraping resources while health is degraded`,
      expected_effect: 'Scraping jobs for this marketplace will be skipped, reducing resource waste',
      validation_metric: 'Monitor health score recovery over next 24-48 hours',
      rollback_plan: 'Re-enable marketplace by setting marketplace_control.enabled = true',
      rollback_payload: {
        enabled: true,
      },
    });

  if (error) {
    logger.error({ error, marketplace }, 'Failed to create change request');
  } else {
    logger.info({ marketplace }, 'Created change request to disable marketplace');
  }
}
