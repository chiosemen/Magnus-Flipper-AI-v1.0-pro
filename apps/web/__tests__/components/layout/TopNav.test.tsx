import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopNav } from '@/components/layout/TopNav';

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

    const avatar = container.querySelector('.w-8.h-8.rounded-full');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveClass('bg-gradient-brand-combined');
  });
});
