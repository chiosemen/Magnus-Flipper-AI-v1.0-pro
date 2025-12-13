import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('Sidebar', () => {
  it('renders logo correctly', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);

    expect(screen.getByText('Magnus Flipper')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);

    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-surfaceSubtle', 'text-foreground');
  });

  it('shows locked state for premium features', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);

    const liveFeedLink = screen.getByText('Live Feed').closest('a');
    expect(liveFeedLink).toHaveClass('opacity-50', 'cursor-not-allowed');
    expect(screen.getByText('🔒')).toBeInTheDocument();
  });

  it('uses design tokens for styling', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    const { container } = render(<Sidebar />);

    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('bg-surface', 'border-border');
  });

  it('renders user tier badge', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    render(<Sidebar />);

    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByText('Free Tier')).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    vi.mocked(usePathname).mockReturnValue('/dashboard');
    const { container } = render(<Sidebar />);

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });
});
