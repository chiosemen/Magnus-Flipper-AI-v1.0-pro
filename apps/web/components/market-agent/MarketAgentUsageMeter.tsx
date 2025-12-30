"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

type UsageData = {
  today: {
    runs: number;
    deploys: number;
    refreshTicks: number;
    itemsReturned: number;
    uniqueQueries: number;
  };
};

type EntitlementData = {
  enabled: boolean;
  status: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'inactive' | 'comped';
  graceUntil?: string | null;
  seatsPurchased?: number;
  seatsUsed?: number;
};

type LimitsData = {
  runsPerDay: number;
  minRefreshSeconds: number;
  maxItemsPerDay: number;
};

type Props = {
  usage: UsageData;
  entitlement: EntitlementData;
  limits: LimitsData;
  onUpgrade?: () => void;
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function MarketAgentUsageMeter({ usage, entitlement, limits, onUpgrade }: Props) {
  const runsPercent = limits.runsPerDay > 0 
    ? Math.min(100, (usage.today.runs / limits.runsPerDay) * 100) 
    : 0;

  const itemsPercent = limits.maxItemsPerDay > 0 
    ? Math.min(100, (usage.today.itemsReturned / limits.maxItemsPerDay) * 100) 
    : 0;

  const nearLimit = runsPercent > 80 || itemsPercent > 80;

  if (!entitlement.enabled && entitlement.status !== 'past_due') {
    return (
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-12 w-12 text-neutral-400 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Market Agent requires an active subscription
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Upgrade to access autonomous market observation with freshness & verification signals.
            </p>
            {onUpgrade && (
              <Button onClick={onUpgrade}>
                Upgrade to Market Agent
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-neutral-200 dark:border-neutral-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Usage today</CardTitle>
          {entitlement.status === 'active' && (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Grace period warning */}
        {entitlement.status === 'past_due' && entitlement.graceUntil && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment pending. Market Agent remains active until{' '}
              <strong>{formatDate(entitlement.graceUntil)}</strong>.
            </AlertDescription>
          </Alert>
        )}

        {/* Near limit warning */}
        {nearLimit && entitlement.enabled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Approaching today's allowance. Resets at midnight UTC.
            </AlertDescription>
          </Alert>
        )}

        {/* Runs meter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Agent runs
            </span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {usage.today.runs} / {limits.runsPerDay}
            </span>
          </div>
          <Progress value={runsPercent} className="h-2" />
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {usage.today.deploys} deploys · {usage.today.refreshTicks} refresh ticks
          </p>
        </div>

        {/* Items meter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Items returned
            </span>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {usage.today.itemsReturned} / {limits.maxItemsPerDay}
            </span>
          </div>
          <Progress value={itemsPercent} className="h-2" />
        </div>

        {/* Stats */}
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-neutral-500 dark:text-neutral-400">Unique queries</p>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {usage.today.uniqueQueries}
              </p>
            </div>
            <div>
              <p className="text-neutral-500 dark:text-neutral-400">Min refresh</p>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                {limits.minRefreshSeconds}s
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 pt-2">
          Resets daily at midnight UTC
        </p>
      </CardContent>
    </Card>
  );
}

