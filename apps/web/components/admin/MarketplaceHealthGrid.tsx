'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionShell } from '@/lib/ui-contracts/SectionShell';
import type { SectionState } from '@/lib/ui-contracts/types';

export type MarketplaceStatus = 'healthy' | 'degraded' | 'offline';

export interface MarketplaceHealth {
  id: string;
  name: string;
  status: MarketplaceStatus;
  lastRun: Date | null;
  listingsFound: number;
  errorCount: number;
}

export interface MarketplaceHealthGridProps {
  marketplaces: MarketplaceHealth[];
  isLoading?: boolean;
  error?: Error;
}

const STATUS_CONFIG = {
  healthy: {
    icon: '🟢',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    label: 'Healthy',
  },
  degraded: {
    icon: '🟡',
    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    label: 'Degraded',
  },
  offline: {
    icon: '🔴',
    color: 'bg-red-500/10 text-red-500 border-red-500/20',
    label: 'Offline',
  },
} as const;

function formatRelativeTime(date: Date | null): string {
  if (!date) return 'Never';

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function MarketplaceHealthGrid({ marketplaces, isLoading, error }: MarketplaceHealthGridProps) {
  const sectionState: SectionState<MarketplaceHealth[]> = {
    state: error ? 'error' : isLoading ? 'loading' : marketplaces.length === 0 ? 'empty' : 'ready',
    data: marketplaces,
    error,
  };

  return (
    <SectionShell
      sectionId="marketplace-health-grid"
      state={sectionState}
      renderLoading={() => <LoadingState />}
      renderEmpty={() => <EmptyState />}
      renderError={(err) => <ErrorState error={err} />}
      renderReady={(data) => <ReadyState marketplaces={data} />}
    />
  );
}

function LoadingState() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Marketplace Health</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="pb-3">Marketplace</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Last Run</th>
                <th className="pb-3">Listings</th>
                <th className="pb-3">Errors</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="py-3">
                    <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                  </td>
                  <td className="py-3">
                    <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Marketplace Health</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4 opacity-40">🏪</div>
          <p className="text-sm font-medium text-foreground mb-2">
            No active scrapers
          </p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Marketplace health metrics will display here once scrapers are configured and running.
          </p>
        </div>
      </div>
    </Card>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Marketplace Health</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-sm font-medium text-foreground mb-2">
            Failed to load marketplace health
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {error.message}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ReadyState({ marketplaces }: { marketplaces: MarketplaceHealth[] }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Marketplace Health</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
                <th className="pb-3 pr-4">Marketplace</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4">Last Run</th>
                <th className="pb-3 pr-4 text-right">Listings</th>
                <th className="pb-3 text-right">Errors</th>
              </tr>
            </thead>
            <tbody>
              {marketplaces.map((marketplace) => (
                <tr
                  key={marketplace.id}
                  className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 pr-4">
                    <span className="text-sm font-medium text-foreground">
                      {marketplace.name}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant="outline"
                      className={`${STATUS_CONFIG[marketplace.status].color} gap-1.5`}
                    >
                      <span>{STATUS_CONFIG[marketplace.status].icon}</span>
                      <span>{STATUS_CONFIG[marketplace.status].label}</span>
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-sm text-muted-foreground">
                      {formatRelativeTime(marketplace.lastRun)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-sm font-medium text-foreground">
                      {marketplace.listingsFound.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={`text-sm font-medium ${
                        marketplace.errorCount > 0
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {marketplace.errorCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
