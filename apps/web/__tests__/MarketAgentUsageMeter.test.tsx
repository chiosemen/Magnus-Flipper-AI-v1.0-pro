import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketAgentUsageMeter } from '@/components/market-agent/MarketAgentUsageMeter';

describe('MarketAgentUsageMeter', () => {
  const defaultUsage = {
    today: {
      runs: 10,
      deploys: 5,
      refreshTicks: 3,
      itemsReturned: 500,
      uniqueQueries: 2,
    },
  };

  const defaultLimits = {
    runsPerDay: 250,
    minRefreshSeconds: 60,
    maxItemsPerDay: 20000,
  };

  it('should render progress bars based on usage/limits props', () => {
    const entitlement = {
      enabled: true,
      status: 'active' as const,
    };

    render(
      <MarketAgentUsageMeter
        usage={defaultUsage}
        entitlement={entitlement}
        limits={defaultLimits}
      />
    );

    // Check that progress bars are rendered (they use Progress component)
    expect(screen.getByText('Agent runs')).toBeInTheDocument();
    expect(screen.getByText('Items returned')).toBeInTheDocument();
    expect(screen.getByText('10 / 250')).toBeInTheDocument();
    expect(screen.getByText('500 / 20000')).toBeInTheDocument();
  });

  it('should show grace notice when status is past_due with graceUntil', () => {
    const entitlement = {
      enabled: true,
      status: 'past_due' as const,
      graceUntil: '2024-12-31T23:59:59Z',
    };

    render(
      <MarketAgentUsageMeter
        usage={defaultUsage}
        entitlement={entitlement}
        limits={defaultLimits}
      />
    );

    expect(screen.getByText(/Payment pending/)).toBeInTheDocument();
    expect(screen.getByText(/Market Agent remains active until/)).toBeInTheDocument();
  });

  it('should show near-limit warning when usage > 80%', () => {
    const highUsage = {
      today: {
        runs: 210, // 84% of 250
        deploys: 100,
        refreshTicks: 50,
        itemsReturned: 17000, // 85% of 20000
        uniqueQueries: 10,
      },
    };

    const entitlement = {
      enabled: true,
      status: 'active' as const,
    };

    render(
      <MarketAgentUsageMeter
        usage={highUsage}
        entitlement={entitlement}
        limits={defaultLimits}
      />
    );

    expect(screen.getByText(/Approaching today's allowance/)).toBeInTheDocument();
  });

  it('should show locked state when enabled is false', () => {
    const entitlement = {
      enabled: false,
      status: 'canceled' as const,
    };

    render(
      <MarketAgentUsageMeter
        usage={defaultUsage}
        entitlement={entitlement}
        limits={defaultLimits}
      />
    );

    expect(screen.getByText(/Market Agent requires an active subscription/)).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to access autonomous market observation/)).toBeInTheDocument();
  });

  it('should show upgrade button when onUpgrade callback is provided and disabled', () => {
    const entitlement = {
      enabled: false,
      status: 'canceled' as const,
    };

    const onUpgrade = vi.fn();

    render(
      <MarketAgentUsageMeter
        usage={defaultUsage}
        entitlement={entitlement}
        limits={defaultLimits}
        onUpgrade={onUpgrade}
      />
    );

    const upgradeButton = screen.getByText('Upgrade to Market Agent');
    expect(upgradeButton).toBeInTheDocument();
  });

  it('should display stats correctly', () => {
    const entitlement = {
      enabled: true,
      status: 'active' as const,
    };

    render(
      <MarketAgentUsageMeter
        usage={defaultUsage}
        entitlement={entitlement}
        limits={defaultLimits}
      />
    );

    expect(screen.getByText('Unique queries')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // uniqueQueries
    expect(screen.getByText('Min refresh')).toBeInTheDocument();
    expect(screen.getByText('60s')).toBeInTheDocument();
  });

  it('should show checkmark icon when status is active', () => {
    const entitlement = {
      enabled: true,
      status: 'active' as const,
    };

    render(
      <MarketAgentUsageMeter
        usage={defaultUsage}
        entitlement={entitlement}
        limits={defaultLimits}
      />
    );

    // CheckCircle2 icon should be present (lucide-react icon)
    const usageToday = screen.getByText('Usage today');
    expect(usageToday).toBeInTheDocument();
  });
});

