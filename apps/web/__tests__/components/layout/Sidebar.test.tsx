import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabaseBrowser: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

const ORIGINAL_ENV = { ...process.env };

const buildSupabaseMock = (
  role: string | null = 'trial',
  plan: string | null = 'trial',
  isTrialExpired = false
) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: role
          ? { id: 'user-1', app_metadata: { role } }
          : null,
      },
    }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: vi.fn().mockResolvedValue({
          data: { plan, is_trial_expired: isTrialExpired },
          error: null,
        }),
      }),
    }),
  }),
});

describe('Sidebar', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.mocked(supabaseBrowser).mockReturnValue(buildSupabaseMock());
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.clearAllMocks();
  });

  it('renders logo correctly', async () => {
    vi.mocked(usePathname).mockReturnValue('/deals');
    render(<Sidebar />);

    expect(await screen.findByText('Magnus Flipper')).toBeInTheDocument();
  });

  it('renders navigation items', async () => {
    vi.mocked(usePathname).mockReturnValue('/deals');
    render(<Sidebar />);

    expect(await screen.findByText('Deals')).toBeInTheDocument();
    expect(screen.getByText('Live Feed')).toBeInTheDocument();
    expect(screen.getByText('Affiliate')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('Scraper Performance')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Admin')).not.toBeInTheDocument();
  });

  it('shows locked state for premium features', async () => {
    vi.mocked(usePathname).mockReturnValue('/deals');
    render(<Sidebar />);

    const lockIcons = await screen.findAllByText('🔒');
    expect(lockIcons.length).toBeGreaterThan(0);
    const analyticsLink = screen.getByText('Analytics').closest('a');
    expect(analyticsLink).toHaveAttribute('href', '/upgrade');
    if (analyticsLink) {
      expect(within(analyticsLink).getByText('🔒')).toBeInTheDocument();
    }
  });

  it('uses design tokens for styling', async () => {
    vi.mocked(usePathname).mockReturnValue('/deals');
    const { container } = render(<Sidebar />);

    await screen.findByText('Deals');
    const sidebar = container.querySelector('aside');
    expect(sidebar).toHaveClass('bg-surface', 'border-border');
  });

  it('renders user tier badge', async () => {
    vi.mocked(usePathname).mockReturnValue('/deals');
    render(<Sidebar />);

    await screen.findByText('Deals');
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByText('Free Tier')).toBeInTheDocument();
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', async () => {
    vi.mocked(usePathname).mockReturnValue('/deals');
    const { container } = render(<Sidebar />);

    await screen.findByText('Deals');
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('redirects trial users away from locked routes', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';

    const profile = {
      id: 'trial-user',
      email: 'trial@example.com',
      role: 'user',
      is_admin: false,
      plan: 'trial',
      trial_expires_at: '2020-01-01T00:00:00.000Z',
      is_trial_expired: false,
    };

    const builder: {
      mode?: 'select' | 'update';
      select: () => typeof builder;
      update: () => typeof builder;
      eq: () => typeof builder | Promise<{ error: null }>;
      single: () => Promise<{ data: typeof profile }>;
    } = {
      mode: 'select',
      select() {
        this.mode = 'select';
        return this;
      },
      update() {
        this.mode = 'update';
        return this;
      },
      eq() {
        if (this.mode === 'update') {
          return Promise.resolve({ error: null });
        }
        return this;
      },
      single: async () => ({ data: profile }),
    };

    const supabaseMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'trial-user', email: 'trial@example.com' } },
        }),
      },
      from: vi.fn(() => builder),
    };

    vi.mocked(createServerClient).mockReturnValue(supabaseMock as never);

    const { middleware } = await import('../../../middleware');
    const request = new NextRequest('http://localhost/pro/analytics');
    const response = await middleware(request);
    const location = response.headers.get('location') ?? '';

    expect(location.includes('/upgrade') || location.includes('/unauthorized')).toBe(true);
  });
});
