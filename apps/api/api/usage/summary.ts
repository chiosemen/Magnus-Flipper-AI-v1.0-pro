import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUserFromJWT } from '../../lib/auth';
import { getServiceSupabaseClient } from '../../lib/supabase';
import { getTierPolicy } from '../../lib/tierPolicy';
import { resolveEntitlement } from '../../lib/entitlementResolver';

function safeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const user = await requireUserFromJWT(req.headers.authorization);
  if (!user.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const supabase = getServiceSupabaseClient();
    const todayStart = startOfDay(new Date()).toISOString();

    const { data, error } = await supabase
      .from('cost_ledger')
      .select('cu_actual')
      .eq('user_id', user.userId)
      .gte('executed_at', todayStart);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const todayCu = (data ?? []).reduce(
      (sum, row) => sum + safeNumber(row.cu_actual),
      0,
    );

    const entitlement = await resolveEntitlement({ userId: user.userId });
    const policy = getTierPolicy(entitlement.tier);
    const dailyLimitCu = policy.dailyCuLimit;
    const percentUsed =
      dailyLimitCu > 0
        ? Number(Math.min(100, (todayCu / dailyLimitCu) * 100).toFixed(1))
        : 0;

    res.status(200).json({
      todayCu,
      dailyLimitCu,
      percentUsed,
      tier: policy.tier,
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Usage summary failed' });
  }
}
