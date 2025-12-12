import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfitCalculator } from '@/src/components/ProfitCalculator';

describe('ProfitCalculator', () => {
  it('renders calculator form', () => {
    render(<ProfitCalculator />);

    expect(screen.getByText('Profit Calculator')).toBeInTheDocument();
    expect(screen.getByLabelText(/Buy Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sell Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fees & Costs/i)).toBeInTheDocument();
  });

  it('calculates gross profit correctly', () => {
    render(<ProfitCalculator />);

    const buyInput = screen.getByLabelText(/Buy Price/i);
    const sellInput = screen.getByLabelText(/Sell Price/i);

    fireEvent.change(buyInput, { target: { value: '100' } });
    fireEvent.change(sellInput, { target: { value: '150' } });

    expect(screen.getByText('£50.00')).toBeInTheDocument(); // Gross profit
  });

  it('calculates net profit correctly', () => {
    render(<ProfitCalculator />);

    const buyInput = screen.getByLabelText(/Buy Price/i);
    const sellInput = screen.getByLabelText(/Sell Price/i);
    const feesInput = screen.getByLabelText(/Fees & Costs/i);

    fireEvent.change(buyInput, { target: { value: '100' } });
    fireEvent.change(sellInput, { target: { value: '150' } });
    fireEvent.change(feesInput, { target: { value: '10' } });

    // Net profit = 150 - 100 - 10 = 40
    const netProfitElements = screen.getAllByText('£40.00');
    expect(netProfitElements.length).toBeGreaterThan(0);
  });

  it('calculates margin correctly', () => {
    render(<ProfitCalculator />);

    const buyInput = screen.getByLabelText(/Buy Price/i);
    const sellInput = screen.getByLabelText(/Sell Price/i);

    fireEvent.change(buyInput, { target: { value: '100' } });
    fireEvent.change(sellInput, { target: { value: '150' } });

    // Margin = (50 / 100) * 100 = 50%
    expect(screen.getByText('50.00%')).toBeInTheDocument();
  });

  it('shows negative profit in destructive color', () => {
    render(<ProfitCalculator />);

    const buyInput = screen.getByLabelText(/Buy Price/i);
    const sellInput = screen.getByLabelText(/Sell Price/i);

    fireEvent.change(buyInput, { target: { value: '150' } });
    fireEvent.change(sellInput, { target: { value: '100' } });

    const netProfit = screen.getByText('-£50.00');
    expect(netProfit).toHaveClass('text-destructive');
  });

  it('uses design tokens for styling', () => {
    const { container } = render(<ProfitCalculator />);

    const card = container.querySelector('.p-6');
    expect(card).toBeInTheDocument();
  });

  it('handles empty inputs gracefully', () => {
    render(<ProfitCalculator />);

    expect(screen.getByText('£0.00')).toBeInTheDocument(); // Default values
  });
});
