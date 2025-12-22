'use client';

import { Badge } from '@/components/ui/badge';

export interface SystemStatus {
  scrapers: 'running' | 'paused' | 'degraded';
  workers: 'healthy' | 'degraded' | 'offline';
  database: 'connected' | 'degraded' | 'offline';
  rateLimits: 'normal' | 'elevated' | 'critical';
}

export interface SystemStatusBarProps {
  isAdmin: boolean;
  status?: SystemStatus;
}

const STATUS_COLORS = {
  running: 'bg-green-500/10 text-green-500 border-green-500/20',
  healthy: 'bg-green-500/10 text-green-500 border-green-500/20',
  connected: 'bg-green-500/10 text-green-500 border-green-500/20',
  normal: 'bg-green-500/10 text-green-500 border-green-500/20',
  paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  degraded: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  elevated: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  offline: 'bg-red-500/10 text-red-500 border-red-500/20',
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
} as const;

const STATUS_ICONS = {
  running: '🟢',
  healthy: '🟢',
  connected: '🟢',
  normal: '🟢',
  paused: '🟡',
  degraded: '🟡',
  elevated: '🟡',
  offline: '🔴',
  critical: '🔴',
} as const;

const DEFAULT_STATUS: SystemStatus = {
  scrapers: 'paused',
  workers: 'healthy',
  database: 'connected',
  rateLimits: 'normal',
};

export function SystemStatusBar({ isAdmin, status = DEFAULT_STATUS }: SystemStatusBarProps) {
  // Always render - Never-Disappear Contract
  if (!isAdmin) {
    return (
      <div className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Admin Control Room
              </span>
              <Badge variant="outline" className="bg-muted">
                Access Denied
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm"
      data-section-id="system-status-bar"
      data-section-state="ready"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              Admin Control Room
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Scrapers Status */}
            <StatusIndicator
              label="Scrapers"
              status={status.scrapers}
              icon={STATUS_ICONS[status.scrapers]}
            />

            {/* Workers Status */}
            <StatusIndicator
              label="Workers"
              status={status.workers}
              icon={STATUS_ICONS[status.workers]}
            />

            {/* Database Status */}
            <StatusIndicator
              label="DB"
              status={status.database}
              icon={STATUS_ICONS[status.database]}
            />

            {/* Rate Limits Status */}
            <StatusIndicator
              label="Rate Limits"
              status={status.rateLimits}
              icon={STATUS_ICONS[status.rateLimits]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatusIndicatorProps {
  label: string;
  status: string;
  icon: string;
}

function StatusIndicator({ label, status, icon }: StatusIndicatorProps) {
  const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.offline;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <Badge variant="outline" className={`${colorClass} gap-1.5`}>
        <span>{icon}</span>
        <span className="capitalize">{status}</span>
      </Badge>
    </div>
  );
}
