/**
 * Auto-Escalator
 * Automatically escalates severity for repeated anomalies
 */

import { getSupabaseClient } from '../services/supabase';
import { logger } from '../utils/logger';

/**
 * Auto-escalate anomalies that occur repeatedly
 */
export async function autoEscalate(): Promise<void> {
  logger.info('Starting auto-escalation check');

  const supabase = getSupabaseClient();
  if (!supabase) {
    logger.warn('Supabase not configured for auto-escalation');
    return;
  }

  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get anomalies from last 24h grouped by marketplace and type
  const { data: anomalies, error } = await supabase
    .from('scrape_anomalies')
    .select('*')
    .gte('created_at', last24h.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ error }, 'Error querying anomalies for escalation');
    return;
  }

  if (!anomalies || anomalies.length === 0) {
    return;
  }

  // Group by marketplace and type
  const groups = new Map<string, any[]>();
  for (const anomaly of anomalies) {
    const key = `${anomaly.marketplace}:${anomaly.type}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(anomaly);
  }

  // Check for groups with ≥3 occurrences
  for (const [key, groupAnomalies] of groups.entries()) {
    if (groupAnomalies.length >= 3) {
      const [marketplace, type] = key.split(':');
      
      logger.warn(
        {
          marketplace,
          type,
          count: groupAnomalies.length,
        },
        `Auto-escalating: ${groupAnomalies.length} occurrences of ${type} for ${marketplace}`
      );

      // Escalate severity by one level
      const severityMap: Record<string, string> = {
        low: 'medium',
        medium: 'high',
        high: 'critical',
        critical: 'critical', // Already at max
      };

      const currentSeverity = groupAnomalies[0].severity;
      const newSeverity = severityMap[currentSeverity] || 'medium';

      // Update all anomalies in this group
      const ids = groupAnomalies.map(a => a.id);
      const { error: updateError } = await supabase
        .from('scrape_anomalies')
        .update({ severity: newSeverity })
        .in('id', ids);

      if (updateError) {
        logger.error({ error: updateError, key }, 'Failed to escalate anomalies');
      } else {
        logger.info(
          { marketplace, type, count: groupAnomalies.length, newSeverity },
          'Escalated anomaly severity'
        );
      }
    }
  }
}
