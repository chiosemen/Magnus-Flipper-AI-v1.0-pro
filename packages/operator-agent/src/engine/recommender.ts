/**
 * Recommendation Engine
 * Generates actionable recommendations based on analysis
 */

import { OperatorResponse } from '../types';
import { explainAnomaly } from './explainer';

export interface RecommendParams {
  question: string;
  marketplace?: string;
  timeWindowHours?: number;
}

/**
 * Generate recommendations for a given situation
 */
export async function recommendAction(params: RecommendParams): Promise<OperatorResponse> {
  // Use explainer to get diagnosis, then enhance with recommendations
  const explanation = await explainAnomaly(params);
  
  // Enhance recommendations based on severity and evidence
  if (explanation.severity === 'critical' && explanation.health_snapshot?.score !== undefined) {
    if (explanation.health_snapshot.score < 30) {
      explanation.recommendations.unshift(
        'Consider temporarily disabling marketplace to prevent resource waste'
      );
    }
  }
  
  // Add escalation recommendations
  if (explanation.evidence.anomalies.length >= 3) {
    explanation.recommendations.push(
      'Multiple anomalies detected - escalate severity assessment'
    );
  }
  
  return explanation;
}

