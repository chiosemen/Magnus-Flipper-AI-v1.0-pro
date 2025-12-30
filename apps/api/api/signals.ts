import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUserFromJWT } from '../lib/auth';
import { getServiceSupabaseClient } from '../lib/supabase';
import { getTierPolicy } from '../lib/tierPolicy';
import { resolveEntitlement } from '../lib/entitlementResolver';

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

  const entitlement = await resolveEntitlement({ userId: user.userId });
  const policy = getTierPolicy(entitlement.tier);
  if (!policy.features.signals) {
    res.status(403).json({ error: 'Signals are not available on your plan.' });
    return;
  }

  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from('deal_signals')
      .select(
        'id, market, query, score, confidence, explanation, warnings, listing, created_at',
      )
      .eq('user_id', user.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({
      tier: policy.tier,
      signals: data ?? [],
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Signals lookup failed' });
  }
}
