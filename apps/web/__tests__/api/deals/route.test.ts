import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/deals/route';
import { getUser, createSupabaseServer } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createSupabaseServer: vi.fn(),
}));

describe('GET /api/deals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/deals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns deals when user is authenticated', async () => {
    const mockUser = { id: 'user-123' };
    const mockDeals = [
      {
        id: 'deal-1',
        deal_id: 'deal-1',
        marketplace: 'eBay',
        estimated_profit: 150,
        estimated_roi: 18.75,
        confidence_level: 'high',
        adjusted_score: 85,
        ai_confidence: 0.9,
        created_at: '2024-01-01T00:00:00Z',
        listing: {
          title: 'iPhone 14 Pro',
          price: 800,
          description: 'Test description',
        },
      },
    ];

    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(createSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: mockDeals, error: null })),
            })),
          })),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/deals');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deals).toBeDefined();
    expect(data.deals.length).toBe(1);
    expect(data.deals[0].title).toBe('iPhone 14 Pro');
  });

  it('handles pagination parameters', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(createSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/deals?limit=10&offset=5');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.offset).toBe(5);
  });

  it('handles errors gracefully', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(createSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } })),
            })),
          })),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/deals');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});
