import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopNav } from '@/components/layout/TopNav';

vi.mock('@/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
}));

describe('TopNav', () => {
  it('renders title correctly', () => {
    render(<TopNav />);
    expect(screen.getByText('Magnus Flipper AI')).toBeInTheDocument();
  });

  it('renders notifications button', () => {
    render(<TopNav />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('uses design tokens for styling', () => {
    const { container } = render(<TopNav />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('bg-surface', 'border-border');
  });

  it('has proper layout structure', () => {
    const { container } = render(<TopNav />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('flex', 'items-center', 'justify-between');
  });

  it('applies correct spacing', () => {
    const { container } = render(<TopNav />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('px-8');
  });

  it('renders user avatar placeholder', () => {
    const { container } = render(<TopNav />);

    const avatar = container.querySelector('.rounded-full.bg-gradient-brand-combined');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('bg-gradient-brand-combined');
  });
});
