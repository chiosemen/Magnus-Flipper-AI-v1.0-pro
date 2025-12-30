import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkUsageLimits, DEFAULT_LIMITS } from '../../lib/usageMetering';
import { getServiceSupabaseClient } from '../../lib/supabase';

// Mock supabase client
vi.mock('../../lib/supabase', () => ({
  getServiceSupabaseClient: vi.fn(),
}));

describe('checkUsageLimits', () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServiceSupabaseClient as any).mockReturnValue(mockSupabase);
  });

  it('should return allowed: true when under limits', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          runs: 50,
          items_returned: 1000,
        },
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    const result = await checkUsageLimits('user-123', DEFAULT_LIMITS);

    expect(result.allowed).toBe(true);
    expect(result.current.runs).toBe(50);
    expect(result.current.itemsReturned).toBe(1000);
  });

  it('should return allowed: false when over runsPerDay limit', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          runs: DEFAULT_LIMITS.runsPerDay + 1,
          items_returned: 1000,
        },
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    const result = await checkUsageLimits('user-123', DEFAULT_LIMITS);

    expect(result.allowed).toBe(false);
    expect(result.current.runs).toBe(DEFAULT_LIMITS.runsPerDay + 1);
  });

  it('should return allowed: false when over itemsPerDay limit', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          runs: 50,
          items_returned: DEFAULT_LIMITS.itemsPerDay + 1,
        },
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    const result = await checkUsageLimits('user-123', DEFAULT_LIMITS);

    expect(result.allowed).toBe(false);
    expect(result.current.itemsReturned).toBe(DEFAULT_LIMITS.itemsPerDay + 1);
  });

  it('should return zero values when no rollup exists', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    const result = await checkUsageLimits('user-123', DEFAULT_LIMITS);

    expect(result.allowed).toBe(true);
    expect(result.current.runs).toBe(0);
    expect(result.current.itemsReturned).toBe(0);
  });

  it('should use DEFAULT_LIMITS when not provided', async () => {
    const mockQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          runs: DEFAULT_LIMITS.runsPerDay - 1,
          items_returned: DEFAULT_LIMITS.itemsPerDay - 1,
        },
        error: null,
      }),
    };

    mockSupabase.from.mockReturnValue(mockQuery);

    const result = await checkUsageLimits('user-123');

    expect(result.allowed).toBe(true);
  });
});

