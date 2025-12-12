import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/deals/[id]/route';
import { getUser, createServerClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  getUser: vi.fn(),
  createServerClient: vi.fn(),
}));

describe('GET /api/deals/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/deals/deal-1');
    const response = await GET(request, { params: Promise.resolve({ id: 'deal-1' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns deal when found', async () => {
    const mockUser = { id: 'user-123' };
    const mockDeal = {
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
        url: 'https://ebay.com/item/123',
      },
    };

    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            or: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockDeal, error: null })),
            })),
          })),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/deals/deal-1');
    const response = await GET(request, { params: Promise.resolve({ id: 'deal-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.deal).toBeDefined();
    expect(data.deal.title).toBe('iPhone 14 Pro');
    expect(data.deal.id).toBe('deal-1');
  });

  it('returns 404 when deal not found', async () => {
    const mockUser = { id: 'user-123' };
    vi.mocked(getUser).mockResolvedValue(mockUser as any);
    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            or: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
            })),
          })),
        })),
      })),
    } as any);

    const request = new NextRequest('http://localhost:3000/api/deals/invalid-id');
    const response = await GET(request, { params: Promise.resolve({ id: 'invalid-id' }) });

    expect(response.status).toBe(404);
  });
});
