'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionShell } from '@/lib/ui-contracts/SectionShell';
import type { SectionState } from '@/lib/ui-contracts/types';

export interface MarketTapeEntry {
  id: string;
  timestamp: Date;
  marketplace: string;
  title: string;
  price: number;
  estimatedMargin: number;
}

export interface LiveMarketTapeProps {
  entries: MarketTapeEntry[];
  isLoading?: boolean;
  error?: Error;
}

const MARKETPLACE_COLORS = {
  facebook: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  ebay: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  vinted: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  craigslist: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  offerup: 'bg-green-500/10 text-green-500 border-green-500/20',
} as const;

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function LiveMarketTape({ entries, isLoading, error }: LiveMarketTapeProps) {
  const sectionState: SectionState<MarketTapeEntry[]> = {
    state: error ? 'error' : isLoading ? 'loading' : entries.length === 0 ? 'empty' : 'ready',
    data: entries,
    error,
  };

  return (
    <SectionShell
      sectionId="live-market-tape"
      state={sectionState}
      renderLoading={() => <LoadingState />}
      renderEmpty={() => <EmptyState />}
      renderError={(err) => <ErrorState error={err} />}
      renderReady={(data) => <ReadyState entries={data} />}
    />
  );
}

function LoadingState() {
  return (
    <Card className="h-[600px] p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Live Market Tape</h3>
          <Badge variant="outline" className="bg-muted">
            Loading...
          </Badge>
        </div>
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-border bg-muted p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-muted-foreground/20" />
                  <div className="h-3 w-full rounded bg-muted-foreground/20" />
                </div>
                <div className="h-4 w-16 rounded bg-muted-foreground/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="h-[600px] p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Live Market Tape</h3>
          <Badge variant="outline" className="bg-muted">
            Idle
          </Badge>
        </div>
        <div className="flex h-[500px] flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-sm text-muted-foreground">
            No market activity yet
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Listings will appear here in real-time
          </p>
        </div>
      </div>
    </Card>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <Card className="h-[600px] p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Live Market Tape</h3>
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            Error
          </Badge>
        </div>
        <div className="flex h-[500px] flex-col items-center justify-center text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-sm font-medium text-foreground mb-2">
            Failed to load market tape
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {error.message}
          </p>
        </div>
      </div>
    </Card>
  );
}

function ReadyState({ entries }: { entries: MarketTapeEntry[] }) {
  return (
    <Card className="h-[600px] overflow-hidden p-6">
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Live Market Tape</h3>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            Live
          </Badge>
        </div>

        {/* Scrollable tape entries */}
        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
          {entries.map((entry) => (
            <TapeEntry key={entry.id} entry={entry} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function TapeEntry({ entry }: { entry: MarketTapeEntry }) {
  const marketplaceKey = entry.marketplace.toLowerCase() as keyof typeof MARKETPLACE_COLORS;
  const colorClass = MARKETPLACE_COLORS[marketplaceKey] || MARKETPLACE_COLORS.facebook;
  const isProfit = entry.estimatedMargin > 0;

  return (
    <div className="rounded-lg border border-border bg-card p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className={`${colorClass} text-xs`}>
              {entry.marketplace}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatTime(entry.timestamp)}
            </span>
          </div>
          <p className="text-sm text-foreground truncate">
            {entry.title}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-medium text-foreground">
            {formatPrice(entry.price)}
          </div>
          <div
            className={`text-xs font-medium ${
              isProfit ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {isProfit ? '+' : ''}
            {formatPrice(entry.estimatedMargin)}
          </div>
        </div>
      </div>
    </div>
  );
}
