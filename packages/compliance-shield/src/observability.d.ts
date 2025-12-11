import { MarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';
export interface ComplianceMetrics {
    successRate: number;
    errorRate?: number;
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
export declare function buildComplianceSnapshot(profile: MarketplaceProfile, proposedMultiplier: number, metrics: ComplianceMetrics, isEmergencyMode?: boolean): ComplianceSnapshot;
//# sourceMappingURL=observability.d.ts.map