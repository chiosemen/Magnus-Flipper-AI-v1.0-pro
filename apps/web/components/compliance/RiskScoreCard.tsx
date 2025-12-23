"use client";

import { Card } from "@/marketing-swoopa/components/ui/card";
import { Badge } from "@/marketing-swoopa/components/ui/card";
import type { RiskScore } from "@magnus-flipper-ai/core/types/compliance";

interface RiskScoreCardProps {
  marketplace: string;
  score: RiskScore;
  rank?: number;
}

/**
 * RiskScoreCard - Displays risk score for a marketplace
 * Uses design tokens for consistent styling
 */
export function RiskScoreCard({ marketplace, score, rank }: RiskScoreCardProps) {
  const getComplianceLevelColor = () => {
    switch (score.complianceLevel) {
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
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-h5 font-heading font-semibold text-foreground capitalize">
            {marketplace}
          </h3>
          {rank !== undefined && (
            <p className="text-body-s text-text-secondary mt-1">Rank #{rank}</p>
          )}
        </div>
        <Badge className={getComplianceLevelColor()}>
          {score.complianceLevel.toUpperCase()}
        </Badge>
      </div>

      {/* Overall Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body-m text-text-secondary">Overall Risk Score</span>
          <span className="text-h3 font-bold text-foreground">{score.overall.toFixed(1)}</span>
        </div>
        <div className="w-full bg-surfaceSubtle rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              score.overall >= 80
                ? "bg-destructive"
                : score.overall >= 60
                ? "bg-warning"
                : score.overall >= 40
                ? "bg-info"
                : "bg-success"
            }`}
            style={{ width: `${score.overall}%` }}
          />
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-body-s">
          <span className="text-text-secondary">Risk Level</span>
          <span className="text-foreground font-medium">{score.factors.riskLevel.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between text-body-s">
          <span className="text-text-secondary">JS Challenge Risk</span>
          <span className="text-foreground font-medium">
            {score.factors.jsChallengeRisk.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between text-body-s">
          <span className="text-text-secondary">Throttle Budget</span>
          <span className="text-foreground font-medium">
            {score.factors.throttleBudget.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center justify-between text-body-s">
          <span className="text-text-secondary">Anti-Bot Requirements</span>
          <span className="text-foreground font-medium">
            {score.factors.antiBotRequirements.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Recommendations */}
      {score.recommendations.length > 0 && (
        <div className="pt-4 border-t border-border">
          <h4 className="text-body-m font-semibold text-foreground mb-2">Recommendations</h4>
          <ul className="space-y-1">
            {score.recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="text-body-s text-text-secondary flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
