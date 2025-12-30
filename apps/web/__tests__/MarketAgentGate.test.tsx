import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketAgentGate } from '@/components/market-agent/MarketAgentGate';

// Mock the upgrade modal
vi.mock('@/components/market-agent/MarketAgentUpgradeModal', () => ({
  MarketAgentUpgradeModal: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    open ? (
      <div data-testid="upgrade-modal">
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
  ),
}));

describe('MarketAgentGate', () => {
  it('should render upgrade button', () => {
    render(<MarketAgentGate />);
    
    const upgradeButton = screen.getByText('Upgrade to Market Agent');
    expect(upgradeButton).toBeInTheDocument();
  });

  it('should open upgrade modal when button is clicked', () => {
    render(<MarketAgentGate />);
    
    const upgradeButton = screen.getByText('Upgrade to Market Agent');
    fireEvent.click(upgradeButton);
    
    const modal = screen.getByTestId('upgrade-modal');
    expect(modal).toBeInTheDocument();
  });

  it('should display feature list', () => {
    render(<MarketAgentGate />);
    
    expect(screen.getByText('Persistent market observation')).toBeInTheDocument();
    expect(screen.getByText('Live capture + verification signals')).toBeInTheDocument();
    expect(screen.getByText('Higher concurrency & freshness guarantees')).toBeInTheDocument();
  });

  it('should display title and description', () => {
    render(<MarketAgentGate />);
    
    expect(screen.getByText('Magnus Market Agent')).toBeInTheDocument();
    expect(screen.getByText(/This feature is available on the Magnus Market Agent plan/)).toBeInTheDocument();
  });
});

