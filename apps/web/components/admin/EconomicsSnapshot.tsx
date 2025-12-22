'use client';

import { Card } from '@/components/ui/card';
import { SectionShell } from '@/lib/ui-contracts/SectionShell';
import type { SectionState } from '@/lib/ui-contracts/types';

export interface EconomicsData {
  listingsToday: number;
  searchesCreated: number;
  estimatedMargin: number;
  coveragePercent: number;
}

export interface EconomicsSnapshotProps extends EconomicsData {
  isLoading?: boolean;
  error?: Error;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

function formatPercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}

export function EconomicsSnapshot({
  listingsToday,
  searchesCreated,
  estimatedMargin,
  coveragePercent,
  isLoading,
  error,
}: EconomicsSnapshotProps) {
  const data: EconomicsData = {
    listingsToday,
    searchesCreated,
    estimatedMargin,
    coveragePercent,
  };

  const sectionState: SectionState<EconomicsData> = {
    state: error ? 'error' : isLoading ? 'loading' : 'ready',
    data,
    error,
  };

  return (
    <SectionShell
      sectionId="economics-snapshot"
      state={sectionState}
      renderLoading={() => <LoadingState />}
      renderEmpty={() => <ReadyState data={data} />}
      renderError={(err) => <ErrorState error={err} />}
      renderReady={(d) => <ReadyState data={d} />}
    />
  );
}

function LoadingState() {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Economics Snapshot</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Economics Snapshot</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-sm font-medium text-foreground mb-2">
            Failed to load economics data
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {error.message}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ReadyState({ data }: { data: EconomicsData }) {
  const metrics = [
    {
      label: 'Listings Today',
      value: formatNumber(data.listingsToday),
      description: '24h window',
      trend: null,
    },
    {
      label: 'Searches Created',
      value: formatNumber(data.searchesCreated),
      description: 'Active users',
      trend: null,
    },
    {
      label: 'Est. Gross Margin',
      value: formatCurrency(data.estimatedMargin),
      description: 'Potential profit',
      trend: data.estimatedMargin > 0 ? 'positive' : 'neutral',
    },
    {
      label: 'Coverage',
      value: formatPercent(data.coveragePercent),
      description: 'Market coverage',
      trend: data.coveragePercent >= 80 ? 'positive' : data.coveragePercent >= 50 ? 'neutral' : 'negative',
    },
  ];

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Economics Snapshot</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {metric.label}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-semibold text-foreground">
                  {metric.value}
                </div>
                {metric.trend === 'positive' && (
                  <span className="text-xs text-green-500">↗</span>
                )}
                {metric.trend === 'negative' && (
                  <span className="text-xs text-red-500">↘</span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {metric.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
