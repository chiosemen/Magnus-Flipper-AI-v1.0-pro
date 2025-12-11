import { MarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
import { calculateRiskScore } from './riskScoring';
import { applyGuardrails } from './guardrails';

export interface ComplianceMetrics {
  successRate: number; // 0-1
  errorRate?: number; // 0-1
  p95LatencyMs?: number;
  recentBlocks?: number;
  recentRuns?: number;
}

export interface ComplianceSnapshot {
  marketplaceId: string;
  riskScore: number;
  complianceLevel: string;
  guardrailMultiplier: number;
  emergencyMode: boolean;
  violations: string[];
  recommendations: string[];
  metrics: ComplianceMetrics;
  timestamp: string;
}

/**
 * Build a compliance snapshot for observability dashboards
 */
export function buildComplianceSnapshot(
  profile: MarketplaceProfile,
  proposedMultiplier: number,
  metrics: ComplianceMetrics,
  isEmergencyMode: boolean = false
): ComplianceSnapshot {
  const risk = calculateRiskScore(profile);
  const guardrailResult = applyGuardrails(
    profile,
    proposedMultiplier,
    metrics.successRate,
    {
      p95LatencyMs: metrics.p95LatencyMs,
      errorRate: metrics.errorRate,
    },
    isEmergencyMode
  );

  return {
    marketplaceId: profile.id,
    riskScore: risk.overall,
    complianceLevel: risk.complianceLevel,
    guardrailMultiplier: guardrailResult.multiplier,
    emergencyMode: guardrailResult.emergencyMode,
    violations: guardrailResult.violations.map((v) => v.message),
    recommendations: risk.recommendations,
    metrics,
    timestamp: new Date().toISOString(),
  };
}
