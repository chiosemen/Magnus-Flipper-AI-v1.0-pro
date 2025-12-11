import { calculateRiskScore } from './riskScoring';
import { applyGuardrails } from './guardrails';
/**
 * Build a compliance snapshot for observability dashboards
 */
export function buildComplianceSnapshot(profile, proposedMultiplier, metrics, isEmergencyMode = false) {
    const risk = calculateRiskScore(profile);
    const guardrailResult = applyGuardrails(profile, proposedMultiplier, metrics.successRate, {
        p95LatencyMs: metrics.p95LatencyMs,
        errorRate: metrics.errorRate,
    }, isEmergencyMode);
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
//# sourceMappingURL=observability.js.map