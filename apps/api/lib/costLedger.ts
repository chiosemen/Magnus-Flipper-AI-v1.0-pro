import { getServiceSupabaseClient } from './supabase';

export type CostLedgerSource = 'search' | 'alert' | 'auto_arbitrage';
export type ProxyType = 'datacenter' | 'residential';

export type CostLedgerEntry = {
  userId: string;
  runId: string;
  source: CostLedgerSource;
  marketplace: string;
  actorId: string;
  cuEstimated: number;
  cuActual: number;
  proxyType: ProxyType;
  executedAt: string;
};

type DailyCu = { date: string; cu: number };
type MonthlyCu = { month: string; cu: number };
type MarketplaceCu = { marketplace: string; cu: number };

function safeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export async function writeCostLedgerEntries(entries: CostLedgerEntry[]) {
  if (!entries.length) return { ok: true };
  try {
    const supabase = getServiceSupabaseClient();
    const payload = entries.map((entry) => ({
      user_id: entry.userId,
      run_id: entry.runId,
      source: entry.source,
      marketplace: entry.marketplace,
      actor_id: entry.actorId,
      cu_estimated: entry.cuEstimated,
      cu_actual: entry.cuActual,
      proxy_type: entry.proxyType,
      executed_at: entry.executedAt,
    }));
    const { error } = await supabase.from('cost_ledger').insert(payload);
    if (error) {
      console.warn('[cost_ledger] insert failed', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error: any) {
    console.warn('[cost_ledger] insert failed', error?.message || error);
    return { ok: false, error: error?.message || 'Unknown error' };
  }
}

export async function getDailyCuUsage(userId: string, days = 7): Promise<DailyCu[]> {
  try {
    const supabase = getServiceSupabaseClient();
    const start = new Date();
    start.setDate(start.getDate() - Math.max(days - 1, 0));
    const { data, error } = await supabase
      .from('cost_ledger')
      .select('executed_at, cu_actual')
      .eq('user_id', userId)
      .gte('executed_at', start.toISOString());
    if (error || !data) return [];
    const buckets = new Map<string, number>();
    for (const row of data) {
      const key = formatDateKey(new Date(row.executed_at));
      buckets.set(key, (buckets.get(key) ?? 0) + safeNumber(row.cu_actual));
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cu]) => ({ date, cu }));
  } catch {
    return [];
  }
}

export async function getMonthlyCuUsage(
  userId: string,
  months = 6,
): Promise<MonthlyCu[]> {
  try {
    const supabase = getServiceSupabaseClient();
    const start = new Date();
    start.setMonth(start.getMonth() - Math.max(months - 1, 0));
    const { data, error } = await supabase
      .from('cost_ledger')
      .select('executed_at, cu_actual')
      .eq('user_id', userId)
      .gte('executed_at', start.toISOString());
    if (error || !data) return [];
    const buckets = new Map<string, number>();
    for (const row of data) {
      const key = formatMonthKey(new Date(row.executed_at));
      buckets.set(key, (buckets.get(key) ?? 0) + safeNumber(row.cu_actual));
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cu]) => ({ month, cu }));
  } catch {
    return [];
  }
}

export async function getCuByMarketplace(
  userId: string,
  days = 30,
): Promise<MarketplaceCu[]> {
  try {
    const supabase = getServiceSupabaseClient();
    const start = new Date();
    start.setDate(start.getDate() - Math.max(days, 0));
    const { data, error } = await supabase
      .from('cost_ledger')
      .select('marketplace, cu_actual, executed_at')
      .eq('user_id', userId)
      .gte('executed_at', start.toISOString());
    if (error || !data) return [];
    const buckets = new Map<string, number>();
    for (const row of data) {
      const key = String(row.marketplace);
      buckets.set(key, (buckets.get(key) ?? 0) + safeNumber(row.cu_actual));
    }
    return Array.from(buckets.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([marketplace, cu]) => ({ marketplace, cu }));
  } catch {
    return [];
  }
}
