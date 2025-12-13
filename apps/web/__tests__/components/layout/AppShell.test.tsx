import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';

describe('AppShell', () => {
  it('renders children correctly', () => {
    render(
      <AppShell>
        <div>Test Content</div>
      </AppShell>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies correct layout structure', () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('flex-1', 'p-8');
  });

  it('uses design tokens for background', () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('bg-background');
  });

  it('renders Sidebar and TopNav', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    // Sidebar should be rendered (check for logo text)
    expect(screen.getByText('Magnus Flipper')).toBeInTheDocument();
    // TopNav should be rendered (check for title)
    expect(screen.getByText('Magnus Flipper AI')).toBeInTheDocument();
  });

  it('has proper accessibility structure', () => {
    const { container } = render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    );

    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
  });
});
