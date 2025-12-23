/**
 * Local Compliance Types
 * Decoupled from @magnus-flipper-ai/core
 */

export interface RiskScore {
  overall: number;
  category: 'low' | 'medium' | 'high' | 'critical';
  factors: {
    name: string;
    score: number;
    weight: number;
  }[];
  timestamp: string;
}

export interface MarketplaceRisk {
  marketplace: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: number;
  lastCheck: string;
  issues: string[];
}

export interface GuardrailStatus {
  id: string;
  name: string;
  status: 'active' | 'triggered' | 'disabled';
  threshold: number;
  currentValue: number;
  lastCheck: string;
}

export interface ComplianceSummary {
  overallScore: number;
  marketplaceRisks: MarketplaceRisk[];
  guardrails: GuardrailStatus[];
  recentViolations: number;
  lastAudit: string;
}

export interface ComplianceSnapshot {
  timestamp: string;
  score: number;
  violations: number;
  status: 'compliant' | 'warning' | 'violation';
}
