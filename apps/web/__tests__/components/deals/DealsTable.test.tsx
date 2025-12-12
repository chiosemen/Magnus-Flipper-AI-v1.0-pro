import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DealsTable } from '@/app/deals/components/DealsTable';

describe('DealsTable', () => {
  const mockDeals = [
    {
      id: '1',
      title: 'iPhone 14 Pro',
      marketplace: 'eBay',
      buyPrice: 800,
      sellPrice: 950,
      profit: 150,
      margin: 18.75,
      status: 'active',
    },
    {
      id: '2',
      title: 'Nike Shoes',
      marketplace: 'Vinted',
      buyPrice: 60,
      sellPrice: null,
      profit: null,
      margin: null,
      status: 'pending',
    },
  ];

  it('renders deals table with data', () => {
    render(<DealsTable deals={mockDeals} />);

    expect(screen.getByText('iPhone 14 Pro')).toBeInTheDocument();
    expect(screen.getByText('Nike Shoes')).toBeInTheDocument();
  });

  it('displays correct deal information', () => {
    render(<DealsTable deals={mockDeals} />);

    expect(screen.getByText('eBay')).toBeInTheDocument();
    expect(screen.getByText('Vinted')).toBeInTheDocument();
    expect(screen.getByText('£800.00')).toBeInTheDocument();
    expect(screen.getByText('£950.00')).toBeInTheDocument();
    expect(screen.getByText('£150.00')).toBeInTheDocument();
  });

  it('handles null values correctly', () => {
    render(<DealsTable deals={mockDeals} />);

    // Should show em dash for null sell price
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('renders empty state when no deals', () => {
    render(<DealsTable deals={[]} />);

    expect(screen.getByText('No deals found')).toBeInTheDocument();
    expect(screen.getByText('Add Your First Deal')).toBeInTheDocument();
  });

  it('applies correct status styling', () => {
    render(<DealsTable deals={mockDeals} />);

    const activeStatus = screen.getByText('active');
    expect(activeStatus).toHaveClass('bg-success/20', 'text-success');

    const pendingStatus = screen.getByText('pending');
    expect(pendingStatus).toHaveClass('bg-text-muted/20', 'text-text-muted');
  });

  it('renders view buttons', () => {
    render(<DealsTable deals={mockDeals} />);

    const viewButtons = screen.getAllByText('View');
    expect(viewButtons.length).toBe(2);
  });

  it('uses design tokens for styling', () => {
    const { container } = render(<DealsTable deals={mockDeals} />);

    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();

    const borders = container.querySelectorAll('.border-border');
    expect(borders.length).toBeGreaterThan(0);
  });

  it('formats currency correctly', () => {
    render(<DealsTable deals={mockDeals} />);

    expect(screen.getByText('£800.00')).toBeInTheDocument();
    expect(screen.getByText('£950.00')).toBeInTheDocument();
    expect(screen.getByText('£150.00')).toBeInTheDocument();
  });

  it('formats margin percentage correctly', () => {
    render(<DealsTable deals={mockDeals} />);

    expect(screen.getByText('18.75%')).toBeInTheDocument();
  });
});
