"use client";

import { Card } from "@magnus-flipper-ai/ui/components/Card";
import { Badge } from "@magnus-flipper-ai/ui/components";
import type { GuardrailStatus } from "@magnus-flipper-ai/core/types/compliance";

interface GuardrailsPanelProps {
  guardrails: GuardrailStatus[];
}

/**
 * GuardrailsPanel - Displays guardrail status for marketplaces
 * Uses design tokens for consistent styling
 */
export function GuardrailsPanel({ guardrails }: GuardrailsPanelProps) {
  return (
    <div className="space-y-4">
      {guardrails.map((item) => (
        <Card key={item.marketplace} className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-h5 font-heading font-semibold text-foreground capitalize">
              {item.marketplace}
            </h3>
            {item.emergencyMode && (
              <Badge className="bg-destructive/20 text-destructive">Emergency Mode</Badge>
            )}
          </div>

          {/* Guardrail Configuration */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-body-s text-text-secondary mb-1">Min Multiplier</p>
              <p className="text-body-m font-semibold text-foreground">
                {item.guardrail.minMultiplier.toFixed(2)}x
              </p>
            </div>
            <div>
              <p className="text-body-s text-text-secondary mb-1">Max Multiplier</p>
              <p className="text-body-m font-semibold text-foreground">
                {item.guardrail.maxMultiplier.toFixed(2)}x
              </p>
            </div>
            <div>
              <p className="text-body-s text-text-secondary mb-1">Emergency Threshold</p>
              <p className="text-body-m font-semibold text-foreground">
                {(item.guardrail.emergencyThreshold * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-body-s text-text-secondary mb-1">Recovery Threshold</p>
              <p className="text-body-m font-semibold text-foreground">
                {(item.guardrail.recoveryThreshold * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Current Multiplier */}
          {item.currentMultiplier !== undefined && (
            <div className="mb-4 p-3 bg-surfaceSubtle rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-body-m text-text-secondary">Current Multiplier</span>
                <span
                  className={`text-h4 font-bold ${
                    item.currentMultiplier < item.guardrail.minMultiplier ||
                    item.currentMultiplier > item.guardrail.maxMultiplier
                      ? "text-destructive"
                      : "text-success"
                  }`}
                >
                  {item.currentMultiplier.toFixed(2)}x
                </span>
              </div>
            </div>
          )}

          {/* Violations */}
          {item.violations.length > 0 && (
            <div className="pt-4 border-t border-border">
              <h4 className="text-body-m font-semibold text-destructive mb-2">Violations</h4>
              <ul className="space-y-1">
                {item.violations.map((violation, index) => (
                  <li key={index} className="text-body-s text-destructive flex items-start gap-2">
                    <span>⚠</span>
                    <span>{violation.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
