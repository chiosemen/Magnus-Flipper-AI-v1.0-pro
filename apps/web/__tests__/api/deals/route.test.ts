import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/deals/route';

describe('GET /api/deals', () => {
  it('returns a disabled response in marketing-only mode', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ disabled: true });
  });
});
