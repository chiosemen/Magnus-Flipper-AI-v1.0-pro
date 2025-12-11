/**
 * Compliance Panel Component
 * Displays compliance metrics, risk scores, and guardrail status
 */

'use client';

import { useEffect, useState } from 'react';
// Using inline card styling for compatibility

interface RiskScore {
  overall: number;
  factors: {
    riskLevel: number;
    jsChallengeRisk: number;
    throttleBudget: number;
    antiBotRequirements: number;
  };
  recommendations: string[];
  complianceLevel: 'safe' | 'caution' | 'high-risk' | 'critical';
}

interface MarketplaceRisk {
  marketplace: string;
  score: RiskScore;
  rank: number;
}

interface ComplianceSummary {
  total: number;
  critical: number;
  highRisk: number;
  caution: number;
  safe: number;
}

export function CompliancePanel() {
  const [riskScores, setRiskScores] = useState<MarketplaceRisk[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskScores();
    const interval = setInterval(fetchRiskScores, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  async function fetchRiskScores() {
    try {
      const response = await fetch('/api/compliance/risk-scores');
      if (!response.ok) throw new Error('Failed to fetch risk scores');
      const data = await response.json();
      setRiskScores(data.marketplaces);
      setSummary(data.summary);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  function getComplianceColor(level: string): string {
    switch (level) {
      case 'critical':
        return 'text-red-500';
      case 'high-risk':
        return 'text-orange-500';
      case 'caution':
        return 'text-yellow-500';
      case 'safe':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  }

  function getRiskBarColor(score: number): string {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  if (loading) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">🛡️ Compliance & Risk Scores</h3>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-4">🛡️ Compliance & Risk Scores</h3>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-lg font-semibold mb-4">Compliance & Risk Scores</h3>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{summary.critical}</div>
            <div className="text-sm text-gray-400">Critical</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{summary.highRisk}</div>
            <div className="text-sm text-gray-400">High Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{summary.caution}</div>
            <div className="text-sm text-gray-400">Caution</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{summary.safe}</div>
            <div className="text-sm text-gray-400">Safe</div>
          </div>
        </div>
      )}

      {/* Risk Scores Table */}
      <div className="space-y-4">
        {riskScores.map((item) => (
          <div key={item.marketplace} className="border-b border-gray-800 pb-4 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-300">
                  #{item.rank} {item.marketplace}
                </span>
                <span className={`text-xs font-semibold ${getComplianceColor(item.score.complianceLevel)}`}>
                  {item.score.complianceLevel.toUpperCase()}
                </span>
              </div>
              <div className="text-lg font-bold">{item.score.overall.toFixed(1)}</div>
            </div>

            {/* Risk Score Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-3">
              <div
                className={`h-2 rounded-full ${getRiskBarColor(item.score.overall)}`}
                style={{ width: `${item.score.overall}%` }}
              />
            </div>

            {/* Risk Factors */}
            <div className="grid grid-cols-4 gap-2 text-xs text-gray-400 mb-2">
              <div>Risk: {item.score.factors.riskLevel.toFixed(0)}</div>
              <div>JS: {item.score.factors.jsChallengeRisk.toFixed(0)}</div>
              <div>Budget: {item.score.factors.throttleBudget.toFixed(0)}</div>
              <div>Anti-Bot: {item.score.factors.antiBotRequirements.toFixed(0)}</div>
            </div>

            {/* Recommendations */}
            {item.score.recommendations.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-400 mb-1">Recommendations:</div>
                <ul className="text-xs text-gray-500 space-y-1">
                  {item.score.recommendations.slice(0, 2).map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
