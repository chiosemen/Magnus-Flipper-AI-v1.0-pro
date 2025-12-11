/**
 * Canary Dashboard Type Definitions
 * 
 * Shared types for canary metrics, ML decisions, and API responses
 */

export type CanaryDecision = 'PROMOTE' | 'ROLLBACK' | 'DEGRADED';

export type CanarySeverity = 'OK' | 'DEGRADED' | 'CRITICAL';

export type CanaryEnvironment = 'production' | 'staging' | 'local';

export interface MlDecisionSummary {
  decision: CanaryDecision;
  confidence: number;        // 0.0–1.0
  severity: CanarySeverity;  // derived from anomalies / error rates
  anomalies: string[];
}

export interface WorkerSideMetrics {
  revision: string;
  errorRate: number;       // 0–1 (e.g. 0.0023 = 0.23%)
  latencyP95: number;      // ms
  healthPassRate: number;  // 0–1
}

export interface CanaryTrafficMeta {
  totalRequestsLast15m: number;
  errorCountLast15m: number;
}

export interface CanaryTimestamps {
  lastAnalysisAt: string;   // ISO
  lastDeploymentAt: string; // ISO
}

export interface CanarySummaryResponse {
  env: CanaryEnvironment;
  worker: string;
  canary: WorkerSideMetrics & {
    traffic: { canary: number; stable: number };
    mlDecision: MlDecisionSummary;
  };
  stable: WorkerSideMetrics;
  traffic: CanaryTrafficMeta;
  timestamps: CanaryTimestamps;
}
