/**
 * Main explanation engine
 * Orchestrates telemetry gathering, RAG retrieval, and AI reasoning
 */

import { searchKnowledge } from '@magnus-flipper-ai/operator-kb';
import { getRecentAnomalies, getRecentRuns, getResolverDecisions } from '../query';
import { reasonWithAI } from '../ai/providers';
import { buildExplainPrompt } from '../ai/prompts';
import { getConfig } from '../config';
import { OperatorResponse } from '../types';

export interface ExplainParams {
  question: string;
  marketplace?: string;
  timeWindowHours?: number;
}

/**
 * Explain an anomaly or answer a question about system state
 */
export async function explainAnomaly(params: ExplainParams): Promise<OperatorResponse> {
  const { question, marketplace, timeWindowHours = 24 } = params;
  const config = getConfig();
  
  console.log(`[OPERATOR] Explaining: "${question}"${marketplace ? ` (${marketplace})` : ''}`);
  
  // 1. Gather telemetry evidence
  const [anomalies, runs, decisions] = await Promise.all([
    getRecentAnomalies({ marketplace, hours: timeWindowHours }),
    getRecentRuns({ marketplace, hours: timeWindowHours }),
    getResolverDecisions({ marketplace, hours: timeWindowHours }),
  ]);
  
  console.log(`[OPERATOR] Found ${anomalies.length} anomalies, ${runs.length} runs, ${decisions.length} decisions`);
  
  // 2. RAG knowledge retrieval (if enabled)
  let kbContext: string[] = [];
  if (config.ragEnabled) {
    try {
      const kbChunks = await searchKnowledge(question, config.ragChunkLimit, config.ragThreshold);
      kbContext = kbChunks.map((c: { content: string }) => c.content);
      console.log(`[OPERATOR] Retrieved ${kbContext.length} KB chunks`);
    } catch (error) {
      console.warn('[OPERATOR] RAG search failed:', error);
      // Continue without KB context
    }
  }
  
  // 3. Build prompt
  const prompt = buildExplainPrompt({
    question,
    marketplace,
    anomalies,
    runs,
    decisions,
    kbContext,
  });
  
  // 4. AI reasoning (with fallback)
  let result: OperatorResponse;
  try {
    result = await reasonWithAI(prompt);
  } catch (error) {
    console.error('[OPERATOR] AI reasoning failed:', error);
    // Return fallback response
    result = {
      severity: 'unknown',
      confidence: 0.0,
      diagnosis: 'AI reasoning failed. Please check system logs.',
      evidence: {
        anomalies,
        runs,
        decisions,
        kb_citations: [],
      },
      reasoning_trace: {
        signals_used: [],
        discarded_signals: [],
        hypotheses_considered: [],
        false_positive_risk: 'high',
      },
      recommendations: ['Check AI provider configuration', 'Review system logs'],
    };
  }
  
  // 5. Validate response and apply confidence gating
  if (result.confidence < config.minConfidenceThreshold) {
    result = {
      ...result,
      severity: 'unknown',
      diagnosis: result.confidence < 0.4 
        ? 'Insufficient telemetry data to provide confident diagnosis'
        : `Low confidence diagnosis (${(result.confidence * 100).toFixed(0)}%). ${result.diagnosis}`,
      recommendations: [
        ...result.recommendations,
        'Increase monitoring window',
        'Verify telemetry collection is active',
      ],
    };
  }
  
  // 6. Add health snapshot if marketplace specified
  if (marketplace && runs.length > 0) {
    const successRate = runs.filter(r => r.success).length / runs.length;
    const anomalyRate = anomalies.length / runs.length;
    const healthScore = Math.round((successRate * 70) + ((1 - anomalyRate) * 30));
    
    // Determine trend (simplified - compare last 12h vs previous 12h)
    const last12h = runs.filter(r => {
      const runTime = new Date(r.created_at).getTime();
      return runTime > Date.now() - 12 * 60 * 60 * 1000;
    });
    const prev12h = runs.filter(r => {
      const runTime = new Date(r.created_at).getTime();
      return runTime > Date.now() - 24 * 60 * 60 * 1000 && runTime <= Date.now() - 12 * 60 * 60 * 1000;
    });
    
    const last12hSuccess = last12h.length > 0 ? last12h.filter(r => r.success).length / last12h.length : 0;
    const prev12hSuccess = prev12h.length > 0 ? prev12h.filter(r => r.success).length / prev12h.length : 0;
    
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    if (last12hSuccess > prev12hSuccess + 0.1) trend = 'improving';
    else if (last12hSuccess < prev12hSuccess - 0.1) trend = 'degrading';
    
    // Find dominant failure mode
    const failureTypes = anomalies.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dominantFailure = Object.entries(failureTypes)
      .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || undefined;
    
    result.health_snapshot = {
      marketplace,
      score: healthScore,
      trend,
      dominant_failure_mode: dominantFailure,
    };
  }
  
  return result;
}

