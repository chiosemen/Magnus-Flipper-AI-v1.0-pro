import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from '@/components/layout/AppShell';
import { supabaseBrowser } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client', () => ({
  supabaseBrowser: vi.fn(),
}));

vi.mock('@/app/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
}));

const buildSupabaseMock = () => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: vi.fn().mockResolvedValue({
          data: { plan: 'free', is_trial_expired: false },
          error: null,
        }),
      }),
    }),
  }),
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
  vi.mocked(supabaseBrowser).mockReturnValue(buildSupabaseMock() as any);
});

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
