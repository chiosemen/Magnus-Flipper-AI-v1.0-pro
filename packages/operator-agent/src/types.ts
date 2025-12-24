/**
 * Operator Agent Type Definitions
 */

export interface OperatorResponse {
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  confidence: number;
  diagnosis: string;
  evidence: {
    anomalies: any[];
    runs: any[];
    decisions: any[];
    kb_citations: string[];
  };
  reasoning_trace: {
    signals_used: string[];
    discarded_signals: string[];
    hypotheses_considered: string[];
    false_positive_risk: 'low' | 'medium' | 'high';
  };
  recommendations: string[];
  health_snapshot?: {
    marketplace: string;
    score: number;
    trend: 'improving' | 'stable' | 'degrading';
    dominant_failure_mode?: string;
  };
  proposed_change_request_id?: string;
}

export type IntentType = 'EXPLAIN' | 'SUMMARIZE' | 'RECOMMEND' | 'PROPOSE_CHANGE';

export interface AnomalyQuery {
  marketplace?: string;
  hours?: number;
  type?: string;
  severity?: string;
}

export interface RunQuery {
  marketplace?: string;
  hours?: number;
  success?: boolean;
}

export interface DecisionQuery {
  marketplace?: string;
  hours?: number;
  chosen_source?: string;
}

