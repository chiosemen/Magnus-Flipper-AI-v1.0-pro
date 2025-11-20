import { getRedis } from "./redis";

export type BudgetKind = "alerts" | "llm";

function key(kind: BudgetKind, orgId: string, ts: number) {
  const minute = Math.floor(ts / 60000);
  return `budget:${kind}:${orgId}:${minute}`;
}

function limitEnv(kind: BudgetKind) {
  if (kind === "alerts") return Number(process.env.BUDGET_ALERTS_RATE_PER_MIN || 60);
  return Number(process.env.BUDGET_LLM_TOKENS_PER_MIN || 30000);
}

export async function takeTokens(
  kind: BudgetKind,
  orgId: string,
  amount: number,
  opts?: { burstMultiplier?: number }
) {
  const now = Date.now();
  const k = key(kind, orgId, now);
  const limit = limitEnv(kind);
  const burst = Math.max(1, Number(opts?.burstMultiplier ?? process.env.BUDGET_BURST_MULTIPLIER || 1));
  const cap = limit * burst;

  const r = await getRedis();
  const pipeline = r.multi();
  pipeline.incrBy(k, amount);
  pipeline.expire(k, 90, "NX"); // expire after 90s if newly created
  const [used] = await pipeline.exec() as [number, unknown];

  if (typeof used !== "number") return { allowed: false, used: limit + 1, remaining: 0, limit, cap };
  const allowed = used <= cap;
  return { allowed, used, remaining: Math.max(0, cap - used), limit, cap };
}
