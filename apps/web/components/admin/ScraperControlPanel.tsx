'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionShell } from '@/lib/ui-contracts/SectionShell';
import type { SectionState } from '@/lib/ui-contracts/types';

export interface MarketplaceToggle {
  id: string;
  name: string;
  enabled: boolean;
}

export interface ScraperControlPanelProps {
  globalEnabled: boolean;
  marketplaces: MarketplaceToggle[];
  rateMultiplier: number;
  isLoading?: boolean;
  error?: Error;
  onGlobalToggle?: (enabled: boolean) => void;
  onMarketplaceToggle?: (id: string, enabled: boolean) => void;
  onRateMultiplierChange?: (multiplier: number) => void;
}

const RATE_PRESETS = [
  { label: '0.1x', value: 0.1, variant: 'slowest' },
  { label: '0.5x', value: 0.5, variant: 'slow' },
  { label: '1.0x', value: 1.0, variant: 'normal' },
  { label: '2.0x', value: 2.0, variant: 'fast' },
  { label: '3.0x', value: 3.0, variant: 'fastest' },
] as const;

export function ScraperControlPanel({
  globalEnabled,
  marketplaces,
  rateMultiplier,
  isLoading,
  error,
  onGlobalToggle,
  onMarketplaceToggle,
  onRateMultiplierChange,
}: ScraperControlPanelProps) {
  const sectionState: SectionState<void> = {
    state: error ? 'error' : isLoading ? 'loading' : 'ready',
    error,
  };

  return (
    <SectionShell
      sectionId="scraper-control-panel"
      state={sectionState}
      renderLoading={() => <LoadingState />}
      renderEmpty={() => <ReadyState
        globalEnabled={globalEnabled}
        marketplaces={marketplaces}
        rateMultiplier={rateMultiplier}
        onGlobalToggle={onGlobalToggle}
        onMarketplaceToggle={onMarketplaceToggle}
        onRateMultiplierChange={onRateMultiplierChange}
      />}
      renderError={(err) => <ErrorState error={err} />}
      renderReady={() => <ReadyState
        globalEnabled={globalEnabled}
        marketplaces={marketplaces}
        rateMultiplier={rateMultiplier}
        onGlobalToggle={onGlobalToggle}
        onMarketplaceToggle={onMarketplaceToggle}
        onRateMultiplierChange={onRateMultiplierChange}
      />}
    />
  );
}

function LoadingState() {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-foreground">Scraper Control Panel</h3>
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-24 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </Card>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Scraper Control Panel</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-sm font-medium text-foreground mb-2">
            Failed to load scraper controls
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {error.message}
          </p>
        </div>
      </div>
    </Card>
  );
}

interface ReadyStateProps {
  globalEnabled: boolean;
  marketplaces: MarketplaceToggle[];
  rateMultiplier: number;
  onGlobalToggle?: (enabled: boolean) => void;
  onMarketplaceToggle?: (id: string, enabled: boolean) => void;
  onRateMultiplierChange?: (multiplier: number) => void;
}

function ReadyState({
  globalEnabled,
  marketplaces,
  rateMultiplier,
  onGlobalToggle,
  onMarketplaceToggle,
  onRateMultiplierChange,
}: ReadyStateProps) {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Scraper Control Panel</h3>
          <Badge
            variant="outline"
            className={
              globalEnabled
                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                : 'bg-red-500/10 text-red-500 border-red-500/20'
            }
          >
            {globalEnabled ? 'Active' : 'Paused'}
          </Badge>
        </div>

        {/* Global Kill Switch */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">
                Global Kill Switch
              </h4>
              <p className="text-xs text-muted-foreground">
                {globalEnabled
                  ? 'All scrapers are currently running'
                  : 'All scrapers are currently paused'}
              </p>
            </div>
            <Button
              variant={globalEnabled ? 'destructive' : 'default'}
              onClick={() => onGlobalToggle?.(!globalEnabled)}
              className="min-w-[120px]"
            >
              {globalEnabled ? 'Pause All' : 'Resume All'}
            </Button>
          </div>
        </div>

        {/* Per-Marketplace Toggles */}
        {marketplaces.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Marketplace Toggles
            </h4>
            <div className="space-y-2">
              {marketplaces.map((marketplace) => (
                <div
                  key={marketplace.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        marketplace.enabled ? 'bg-green-500' : 'bg-muted-foreground'
                      }`}
                    />
                    <span className="text-sm text-foreground">
                      {marketplace.name}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMarketplaceToggle?.(marketplace.id, !marketplace.enabled)}
                    disabled={!globalEnabled}
                    className="min-w-[80px]"
                  >
                    {marketplace.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rate Multiplier */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Rate Multiplier
          </h4>
          <div className="flex items-center gap-2">
            {RATE_PRESETS.map((preset) => {
              const isActive = rateMultiplier === preset.value;
              return (
                <Button
                  key={preset.value}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onRateMultiplierChange?.(preset.value)}
                  className="flex-1"
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Current rate: {rateMultiplier}x
            {rateMultiplier < 1.0 && ' (Throttled)'}
            {rateMultiplier > 1.0 && ' (Accelerated)'}
          </p>
        </div>
      </div>
    </Card>
  );
}
