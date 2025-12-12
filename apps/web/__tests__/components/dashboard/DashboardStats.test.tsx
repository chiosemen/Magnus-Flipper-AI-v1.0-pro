import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardStats } from '@/app/dashboard/components/DashboardStats';

describe('DashboardStats', () => {
  const mockStats = {
    activeDeals: 5,
    totalDeals: 10,
    monthlyROI: 1250.50,
    alerts: 3,
  };

  it('renders all stat cards', () => {
    render(<DashboardStats stats={mockStats} />);

    expect(screen.getByText('Active Deals')).toBeInTheDocument();
    expect(screen.getByText('Monthly ROI')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });

  it('displays correct stat values', () => {
    render(<DashboardStats stats={mockStats} />);

    expect(screen.getByText('5')).toBeInTheDocument(); // Active Deals
    expect(screen.getByText('£1250.50')).toBeInTheDocument(); // Monthly ROI
    expect(screen.getByText('3')).toBeInTheDocument(); // Alerts
  });

  it('uses design tokens for styling', () => {
    const { container } = render(<DashboardStats stats={mockStats} />);

    const cards = container.querySelectorAll('.p-6');
    expect(cards.length).toBe(3);
  });

  it('applies correct typography tokens', () => {
    const { container } = render(<DashboardStats stats={mockStats} />);

    const labels = container.querySelectorAll('.text-text-secondary');
    expect(labels.length).toBeGreaterThan(0);

    const values = container.querySelectorAll('.text-h2');
    expect(values.length).toBeGreaterThan(0);
  });

  it('handles zero values correctly', () => {
    const zeroStats = {
      activeDeals: 0,
      totalDeals: 0,
      monthlyROI: 0,
      alerts: 0,
    };

    render(<DashboardStats stats={zeroStats} />);

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getByText('£0.00')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    render(<DashboardStats stats={mockStats} />);

    const roiElement = screen.getByText('£1250.50');
    expect(roiElement).toBeInTheDocument();
  });
});
