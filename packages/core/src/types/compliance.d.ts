/**
 * Compliance Types
 *
 * Shared TypeScript types for Compliance Shield
 * Used across web and worker platforms
 */
import type { RiskScore } from "@magnus-flipper-ai/compliance-shield/riskScoring";
import type { ThrottleGuardrail, GuardrailViolation } from "@magnus-flipper-ai/compliance-shield/guardrails";
import type { ComplianceSnapshot, ComplianceMetrics } from "@magnus-flipper-ai/compliance-shield/observability";
/**
 * Re-export compliance types from compliance-shield package
 */
export type { RiskScore, ThrottleGuardrail, GuardrailViolation, ComplianceSnapshot, ComplianceMetrics, };
/**
 * Marketplace Risk Summary
 */
export interface MarketplaceRisk {
    marketplace: string;
    score: RiskScore;
    rank: number;
}
/**
 * Compliance Summary
 */
export interface ComplianceSummary {
    total: number;
    critical: number;
    highRisk: number;
    caution: number;
    safe: number;
}
/**
 * Guardrail Status
 */
export interface GuardrailStatus {
    marketplace: string;
    guardrail: ThrottleGuardrail;
    currentMultiplier?: number;
    violations: GuardrailViolation[];
    emergencyMode: boolean;
}
/**
 * Compliance Dashboard Data
 */
export interface ComplianceDashboardData {
    summary: ComplianceSummary;
    marketplaceRisks: MarketplaceRisk[];
    guardrails: GuardrailStatus[];
    recentSnapshots: ComplianceSnapshot[];
}
//# sourceMappingURL=compliance.d.ts.map