"use client";

import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { useComplianceRisk } from "@/hooks/useComplianceRisk";
import { useComplianceGuardrails } from "@/hooks/useComplianceGuardrails";
import { RiskScoreCard } from "./RiskScoreCard";
import { MarketplaceRiskTable } from "./MarketplaceRiskTable";
import { GuardrailsPanel } from "./GuardrailsPanel";
import type { ComplianceSummary } from "@magnus-flipper-ai/core/types/compliance";

/**
 * ComplianceDashboard - Main compliance dashboard component
 * Displays risk scores, guardrails, and compliance summary
 */
export function ComplianceDashboard() {
  const { data: riskData, isLoading: riskLoading } = useComplianceRisk();
  const { data: guardrailsData, isLoading: guardrailsLoading } = useComplianceGuardrails();

  if (riskLoading || guardrailsLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-6 bg-surfaceSubtle rounded w-1/4 mb-4"></div>
            <div className="h-32 bg-surfaceSubtle rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const summary: ComplianceSummary = riskData?.summary || {
    total: 0,
    critical: 0,
    highRisk: 0,
    caution: 0,
    safe: 0,
  };

  const marketplaceRisks = riskData?.marketplaceRisks || [];
  const guardrails = Array.isArray(guardrailsData?.guardrails)
    ? guardrailsData.guardrails
    : guardrailsData?.guardrails
    ? [guardrailsData.guardrails]
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-body-s text-text-secondary mb-1">Total Marketplaces</div>
          <div className="text-h3 font-bold text-foreground">{summary.total}</div>
        </Card>
        <Card className="p-6">
          <div className="text-body-s text-text-secondary mb-1">Critical</div>
          <div className="text-h3 font-bold text-destructive">{summary.critical}</div>
        </Card>
        <Card className="p-6">
          <div className="text-body-s text-text-secondary mb-1">High Risk</div>
          <div className="text-h3 font-bold text-warning">{summary.highRisk}</div>
        </Card>
        <Card className="p-6">
          <div className="text-body-s text-text-secondary mb-1">Safe</div>
          <div className="text-h3 font-bold text-success">{summary.safe}</div>
        </Card>
      </div>

      {/* Risk Table */}
      {marketplaceRisks.length > 0 && (
        <MarketplaceRiskTable risks={marketplaceRisks} />
      )}

      {/* Risk Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {marketplaceRisks.slice(0, 6).map((risk) => (
          <RiskScoreCard
            key={risk.marketplace}
            marketplace={risk.marketplace}
            score={risk.score}
            rank={risk.rank}
          />
        ))}
      </div>

      {/* Guardrails Panel */}
      {guardrails.length > 0 && <GuardrailsPanel guardrails={guardrails} />}
    </div>
  );
}
