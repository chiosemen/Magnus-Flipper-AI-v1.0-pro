'use client';

/**
 * Tech Trade Trader Ops Dashboard
 * 
 * Route: /admin/tech-trade/ops
 * 
 * A Betfair-style trading operations dashboard for monitoring:
 * - System status (pricing halt, anchor state)
 * - Market overview (liquidity, momentum, confidence)
 * - Top movers (biggest price changes)
 * - Risk flags (stale anchors, low confidence)
 * 
 * This is READ-ONLY - no mutations from this dashboard.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// Types
// ============================================================================

interface SystemStatus {
  pricingHalted: boolean;
  haltReason: string | null;
  anchorsEnabled: boolean;
  lastAnchorIngestion: string | null;
  systemHealth: 'healthy' | 'degraded' | 'halted';
}

interface MarketOverview {
  activeVariants: number;
  liquidity: {
    high: number;
    highPercent: number;
    medium: number;
    mediumPercent: number;
    low: number;
    lowPercent: number;
  };
  momentum: {
    trendingUp: number;
    trendingUpPercent: number;
    trendingDown: number;
    trendingDownPercent: number;
    stable: number;
    stablePercent: number;
  };
  avgConfidence: number;
  confidenceFactors: {
    freshness: number;
    sourceAgreement: number;
    coverage: number;
  };
  riskFlags: {
    staleAnchors: {
      cex: number;
      backMarket: number;
      total: number;
    };
    lowConfidenceDevices: number;
    pricingHalted: boolean;
    haltReason: string | null;
  };
  volume: {
    quotesToday: number;
    quotesThisWeek: number;
    quotesThisMonth: number;
  };
  generatedAt: string;
}

interface TopMover {
  deviceId: string;
  brand: string;
  model: string;
  category: string;
  change7d: number;
  change30d: number;
  direction: 'up' | 'down' | 'stable';
  confidence: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  currentPrice: number;
  previousPrice: number;
}

// ============================================================================
// Components
// ============================================================================

function SystemStatusBar({ status }: { status: SystemStatus | null }) {
  if (!status) {
    return (
      <div className="bg-slate-900 border-b border-slate-800 p-3">
        <div className="text-slate-400">Loading system status...</div>
      </div>
    );
  }
  
  const healthColors = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    halted: 'bg-red-500',
  };
  
  return (
    <div className="bg-slate-900 border-b border-slate-800 p-3 sticky top-0 z-10">
      <div className="flex items-center gap-6 text-sm">
        {/* Pricing Status */}
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${
            status.pricingHalted ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
          }`} />
          <span className={status.pricingHalted ? 'text-red-400' : 'text-emerald-400'}>
            {status.pricingHalted ? 'HALTED' : 'ACTIVE'}
          </span>
        </div>
        
        <div className="h-4 w-px bg-slate-700" />
        
        {/* Anchors Status */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Anchors:</span>
          <span className={status.anchorsEnabled ? 'text-emerald-400' : 'text-red-400'}>
            {status.anchorsEnabled ? 'ON' : 'OFF'}
          </span>
        </div>
        
        <div className="h-4 w-px bg-slate-700" />
        
        {/* Last Ingestion */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Last Ingestion:</span>
          <span className="text-slate-300 font-mono text-xs">
            {status.lastAnchorIngestion 
              ? new Date(status.lastAnchorIngestion).toLocaleString()
              : 'Never'
            }
          </span>
        </div>
        
        <div className="h-4 w-px bg-slate-700" />
        
        {/* System Health */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Health:</span>
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${healthColors[status.systemHealth]} text-black`}>
            {status.systemHealth.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  subValue,
  trend,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-slate-400',
  };
  
  return (
    <div className="p-3 bg-slate-800/50 rounded-lg">
      <div className="text-slate-400 text-xs mb-1">{label}</div>
      <div className={`text-xl font-bold ${trend ? trendColors[trend] : 'text-white'}`}>
        {value}
      </div>
      {subValue && (
        <div className="text-slate-400 text-xs mt-1">{subValue}</div>
      )}
    </div>
  );
}

function MarketOverviewSection({ overview }: { overview: MarketOverview | null }) {
  if (!overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Active Variants */}
          <MetricCard
            label="Active Variants"
            value={overview.activeVariants.toLocaleString()}
          />
          
          {/* Liquidity Distribution */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-slate-400 text-xs mb-2">Liquidity Distribution</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">High</span>
                <span>{overview.liquidity.high.toLocaleString()} ({overview.liquidity.highPercent}%)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-amber-400">Medium</span>
                <span>{overview.liquidity.medium.toLocaleString()} ({overview.liquidity.mediumPercent}%)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">Low</span>
                <span>{overview.liquidity.low.toLocaleString()} ({overview.liquidity.lowPercent}%)</span>
              </div>
            </div>
          </div>
          
          {/* Momentum Distribution */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-slate-400 text-xs mb-2">Momentum (7d)</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">↑ Trending Up</span>
                <span>{overview.momentum.trendingUpPercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">↓ Trending Down</span>
                <span>{overview.momentum.trendingDownPercent}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">→ Stable</span>
                <span>{overview.momentum.stablePercent}%</span>
              </div>
            </div>
          </div>
          
          {/* Confidence */}
          <MetricCard
            label="Avg Confidence"
            value={(overview.avgConfidence * 100).toFixed(0) + '%'}
            subValue={`F: ${(overview.confidenceFactors.freshness * 100).toFixed(0)}% | S: ${(overview.confidenceFactors.sourceAgreement * 100).toFixed(0)}% | C: ${(overview.confidenceFactors.coverage * 100).toFixed(0)}%`}
          />
          
          {/* Volume */}
          <div className="p-3 bg-slate-800/50 rounded-lg">
            <div className="text-slate-400 text-xs mb-2">Quote Volume</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold">{overview.volume.quotesToday}</div>
                <div className="text-xs text-slate-400">Today</div>
              </div>
              <div>
                <div className="text-lg font-bold">{overview.volume.quotesThisWeek}</div>
                <div className="text-xs text-slate-400">This Week</div>
              </div>
              <div>
                <div className="text-lg font-bold">{overview.volume.quotesThisMonth}</div>
                <div className="text-xs text-slate-400">This Month</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskFlagsSection({ overview }: { overview: MarketOverview | null }) {
  if (!overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }
  
  const flags = overview.riskFlags;
  const hasRisks = flags.staleAnchors.total > 0 || 
                   flags.lowConfidenceDevices > 0 || 
                   flags.pricingHalted;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Flags</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasRisks ? (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-center">
            No active risk flags
          </div>
        ) : (
          <div className="space-y-3">
            {/* Stale Anchors */}
            {flags.staleAnchors.total > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="text-amber-400 font-medium mb-2">Stale Anchors</div>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">CeX:</span>
                    <span>{flags.staleAnchors.cex} anchors (&gt;7 days)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Back Market:</span>
                    <span>{flags.staleAnchors.backMarket} anchors (&gt;7 days)</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Low Confidence Devices */}
            {flags.lowConfidenceDevices > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="text-amber-400 font-medium mb-1">Low Confidence + High Demand</div>
                <div className="text-sm text-slate-300">
                  {flags.lowConfidenceDevices} devices with confidence &lt;40%
                </div>
              </div>
            )}
            
            {/* Pricing Halted */}
            {flags.pricingHalted && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 font-medium">Pricing Halted</span>
                </div>
                {flags.haltReason && (
                  <div className="text-sm text-red-300/80 mt-1">
                    {flags.haltReason}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopMoversTable({ movers }: { movers: TopMover[] | null }) {
  if (!movers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Movers (7d)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400">Loading...</div>
        </CardContent>
      </Card>
    );
  }
  
  const confidenceColors = {
    high: 'text-emerald-400',
    medium: 'text-amber-400',
    low: 'text-red-400',
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Movers (7d)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 px-3 text-slate-400 font-medium">Device</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Change (7d)</th>
                <th className="text-center py-2 px-3 text-slate-400 font-medium">Direction</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Confidence</th>
                <th className="text-right py-2 px-3 text-slate-400 font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {movers.map((mover) => (
                <tr key={mover.deviceId} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-2 px-3">
                    <div className="font-medium">{mover.brand} {mover.model}</div>
                    <div className="text-xs text-slate-400">{mover.category}</div>
                  </td>
                  <td className={`py-2 px-3 text-right font-mono ${
                    mover.change7d > 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {mover.change7d > 0 ? '+' : ''}{mover.change7d.toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`text-lg ${
                      mover.direction === 'up' ? 'text-emerald-400' : 
                      mover.direction === 'down' ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {mover.direction === 'up' ? '↑' : mover.direction === 'down' ? '↓' : '→'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className={confidenceColors[mover.confidenceLevel]}>
                      {(mover.confidence * 100).toFixed(0)}%
                    </span>
                    <span className="text-slate-500 text-xs ml-1">
                      ({mover.confidenceLevel.toUpperCase()})
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    £{mover.currentPrice.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function TraderOpsDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [movers, setMovers] = useState<TopMover[] | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fetchData = useCallback(async () => {
    try {
      const [statusRes, overviewRes, moversRes] = await Promise.all([
        fetch('/api/admin/tech-trade/ops/status'),
        fetch('/api/admin/tech-trade/ops/overview'),
        fetch('/api/admin/tech-trade/ops/movers'),
      ]);
      
      const [statusData, overviewData, moversData] = await Promise.all([
        statusRes.json(),
        overviewRes.json(),
        moversRes.json(),
      ]);
      
      setStatus(statusData);
      setOverview(overviewData);
      setMovers(moversData.movers);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to fetch dashboard data');
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* System Status Bar (sticky) */}
      <SystemStatusBar status={status} />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">Trader Ops Dashboard</h1>
              <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded">
                Internal
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Tech Trade market monitoring and risk oversight
            </p>
          </div>
          <div className="text-right text-sm text-slate-400">
            {lastUpdate && (
              <div>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            <div className="text-xs">Auto-refresh: 30s</div>
          </div>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}
        
        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Market Overview */}
          <div>
            <MarketOverviewSection overview={overview} />
          </div>
          
          {/* Middle Column: Risk Flags */}
          <div>
            <RiskFlagsSection overview={overview} />
          </div>
          
          {/* Right Column: Empty for now, could add audit snapshot */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <a
                    href="/admin/tech-trade/risk"
                    className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="font-medium">Risk Control Panel</div>
                    <div className="text-xs text-slate-400">Manage pricing kill switch</div>
                  </a>
                  <a
                    href="/tech-trade"
                    className="block p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="font-medium">Quote Interface</div>
                    <div className="text-xs text-slate-400">Test B2C quote flow</div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Top Movers Table (full width) */}
        <div className="mt-6">
          <TopMoversTable movers={movers} />
        </div>
      </div>
    </div>
  );
}

