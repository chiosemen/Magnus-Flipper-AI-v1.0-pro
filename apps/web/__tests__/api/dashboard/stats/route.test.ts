import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/dashboard/stats/route';
import { getUser, createServerClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createServerClient: vi.fn(),
}));

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns dashboard stats when authenticated', async () => {
    const mockUser = { id: 'user-123' };
    const mockDeals = [
      { id: '1', estimated_profit: 100, confidence_level: 'high' },
      { id: '2', estimated_profit: 50, confidence_level: 'very_high' },
    ];
    const mockMarketplaces = [
      { marketplace: 'eBay', status: 'healthy', last_seen: '2024-01-01T00:00:00Z' },
    ];

    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'deal_scores') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: mockDeals, error: null })),
            })),
          };
        }
        if (table === 'scraper_health') {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: mockMarketplaces, error: null })),
            })),
          };
        }
        return {};
      }),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toBeDefined();
    expect(data.stats.activeDeals).toBe(2);
    expect(data.stats.monthlyROI).toBe(150);
    expect(data.markplaces).toBeDefined();
  });

  it('handles empty data gracefully', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/dashboard/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.activeDeals).toBe(0);
    expect(data.stats.monthlyROI).toBe(0);
  });
});
