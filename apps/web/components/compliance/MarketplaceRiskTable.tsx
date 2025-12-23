"use client";

import { Card } from "@/marketing-swoopa/components/ui/card";
import { Badge } from "@/marketing-swoopa/components/ui/badge";
import type { MarketplaceRisk } from "@/lib/types/compliance";

interface MarketplaceRiskTableProps {
  risks: MarketplaceRisk[];
}

/**
 * MarketplaceRiskTable - Displays risk scores in a table format
 * Uses design tokens for consistent styling
 */
export function MarketplaceRiskTable({ risks }: MarketplaceRiskTableProps) {
  const getComplianceLevelColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-destructive/20 text-destructive";
      case "high-risk":
        return "bg-warning/20 text-warning";
      case "caution":
        return "bg-info/20 text-info";
      case "safe":
        return "bg-success/20 text-success";
      default:
        return "bg-surfaceSubtle text-text-secondary";
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-h4 font-heading font-semibold text-foreground mb-4">
        Marketplace Risk Comparison
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-body-s font-semibold text-text-secondary">
                Rank
              </th>
              <th className="text-left py-3 px-4 text-body-s font-semibold text-text-secondary">
                Marketplace
              </th>
              <th className="text-right py-3 px-4 text-body-s font-semibold text-text-secondary">
                Risk Score
              </th>
              <th className="text-center py-3 px-4 text-body-s font-semibold text-text-secondary">
                Level
              </th>
              <th className="text-left py-3 px-4 text-body-s font-semibold text-text-secondary">
                Key Factors
              </th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk) => (
              <tr
                key={risk.marketplace}
                className="border-b border-border hover:bg-surfaceSubtle transition-colors"
              >
                <td className="py-4 px-4">
                  <span className="text-body-m font-medium text-foreground">#{risk.rank ?? "-"}</span>
                </td>
                <td className="py-4 px-4">
                  <span className="text-body-m font-medium text-foreground capitalize">
                    {risk.marketplace}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="text-body-m font-semibold text-foreground">
                    {risk.score.overall.toFixed(1)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <Badge className={getComplianceLevelColor(risk.score.complianceLevel)}>
                    {risk.score.complianceLevel}
                  </Badge>
                </td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-2">
                    {risk.score.factors.jsChallengeRisk > 50 && (
                      <Badge variant="warning" className="text-xs">
                        JS Challenge
                      </Badge>
                    )}
                    {risk.score.factors.throttleBudget > 50 && (
                      <Badge variant="info" className="text-xs">
                        Low Budget
                      </Badge>
                    )}
                    {risk.score.factors.antiBotRequirements > 50 && (
                      <Badge variant="destructive" className="text-xs">
                        Anti-Bot
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
