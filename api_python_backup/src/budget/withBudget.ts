import { takeTokens } from "./tokenBucket";

export async function withBudget<T>(
  orgId: string,
  kind: "alerts" | "llm",
  amount: number,
  fn: () => Promise<T>
): Promise<T> {
  const result = await takeTokens(kind, orgId, amount);
  if (!result.allowed) {
    throw new Error(`Budget exceeded for ${kind}: used=${result.used}, cap=${result.cap}`);
  }
  return fn();
}
