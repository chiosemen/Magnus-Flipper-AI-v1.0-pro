import { createClient } from '@supabase/supabase-js';
import { TIER_POLICIES, type Tier } from './tierPolicy';

type SupabaseClient = ReturnType<typeof createClient>;

export async function getUserTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<Tier> {
  try {
    const { data, error } = await supabase
      .from('user_tiers')
      .select('tier')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data?.tier) {
      return 'free';
    }
    const normalized = String(data.tier).toLowerCase();
    return normalized in TIER_POLICIES ? (normalized as Tier) : 'free';
  } catch {
    return 'free';
  }
}

export async function requireUserFromJWT(authHeader?: string) {
  if (!authHeader) {
    return { userId: null, tier: 'free' as Tier };
  }

  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : authHeader.trim();
  if (!token) {
    return { userId: null, tier: 'free' as Tier };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { userId: null, tier: 'free' as Tier };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return { userId: null, tier: 'free' as Tier };
    }

    const tier = await getUserTier(supabase, data.user.id);
    return { userId: data.user.id, tier };
  } catch {
    return { userId: null, tier: 'free' as Tier };
  }
}
