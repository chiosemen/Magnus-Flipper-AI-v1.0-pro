import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarketplaceStatus } from '@/app/dashboard/components/MarketplaceStatus';

describe('MarketplaceStatus', () => {
  const mockMarketplaces = [
    { name: 'Amazon', status: 'live' as const },
    { name: 'eBay', status: 'warming' as const },
    { name: 'Facebook', status: 'offline' as const },
  ];

  it('renders marketplace status cards', () => {
    render(<MarketplaceStatus marketplaces={mockMarketplaces} />);

    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('eBay')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
  });

  it('displays correct status indicators', () => {
    render(<MarketplaceStatus marketplaces={mockMarketplaces} />);

    expect(screen.getByText('live')).toBeInTheDocument();
    expect(screen.getByText('warming')).toBeInTheDocument();
    expect(screen.getByText('offline')).toBeInTheDocument();
  });

  it('applies correct status colors', () => {
    const { container } = render(<MarketplaceStatus marketplaces={mockMarketplaces} />);

    // Live status should have success color
    const liveIndicator = container.querySelector('.bg-success');
    expect(liveIndicator).toBeInTheDocument();

    // Warning status should have warning color
    const warmingIndicator = container.querySelector('.bg-warning');
    expect(warmingIndicator).toBeInTheDocument();

    // Offline status should have destructive color
    const offlineIndicator = container.querySelector('.bg-destructive');
    expect(offlineIndicator).toBeInTheDocument();
  });

  it('uses default marketplaces when none provided', () => {
    render(<MarketplaceStatus marketplaces={[]} />);

    // Should show default marketplaces
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('eBay')).toBeInTheDocument();
  });

  it('uses design tokens for styling', () => {
    const { container } = render(<MarketplaceStatus marketplaces={mockMarketplaces} />);

    const card = container.querySelector('.p-6');
    expect(card).toBeInTheDocument();

    const statusItems = container.querySelectorAll('.bg-surfaceSubtle');
    expect(statusItems.length).toBeGreaterThan(0);
  });

  it('renders title correctly', () => {
    render(<MarketplaceStatus marketplaces={mockMarketplaces} />);

    expect(screen.getByText('Marketplace Integration Status')).toBeInTheDocument();
  });
});
