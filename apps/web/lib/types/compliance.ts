/**
 * Local Compliance Types
 * Decoupled from @magnus-flipper-ai/core
 */

export interface RiskScore {
  overall: number;
  category: 'low' | 'medium' | 'high' | 'critical';
  complianceLevel: 'critical' | 'high-risk' | 'moderate' | 'low-risk' | 'compliant' | 'caution' | 'safe';
  factors: {
    riskLevel: number;
    jsChallengeRisk: number;
    throttleBudget: number;
    antiBotRequirements: number;
  };
  recommendations: string[];
  timestamp: string;
}

export interface MarketplaceRisk {
  marketplace: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  violations: number;
  lastCheck: string;
  issues: string[];
  rank: number;
  score: {
    overall: number;
    complianceLevel: string;
    factors: {
      jsChallengeRisk: number;
      throttleBudget: number;
      antiBotRequirements: number;
    };
  };
}

export interface GuardrailStatus {
  id: string;
  name: string;
  status: 'active' | 'triggered' | 'disabled';
  threshold: number;
  currentValue: number;
  lastCheck: string;
  marketplace: string;
  emergencyMode?: boolean;
  guardrail: {
    minMultiplier: number;
    maxMultiplier: number;
    emergencyThreshold: number;
    recoveryThreshold: number;
  };
  currentMultiplier?: number;
  violations: Array<{
    message: string;
  }>;
}

export interface ComplianceSummary {
  overallScore: number;
  marketplaceRisks: MarketplaceRisk[];
  guardrails: GuardrailStatus[];
  recentViolations: number;
  lastAudit: string;
  total: number;
  critical: number;
  criticalRisk: number;
  criticalRisks: number;
  high: number;
  highRisk: number;
  highRisks: number;
  medium: number;
  mediumRisk: number;
  mediumRisks: number;
  low: number;
  lowRisk: number;
  lowRisks: number;
  safe: number;
  guardrailsEnabled: number;
  lastUpdated: string;
}

export interface ComplianceSnapshot {
  timestamp: string;
  score: number;
  violations: number;
  status: 'compliant' | 'warning' | 'violation';
}
