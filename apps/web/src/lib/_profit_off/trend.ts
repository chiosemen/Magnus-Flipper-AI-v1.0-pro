// apps/web/src/lib/profit/trend.ts

/**
 * Profit trend wrapper
 * Wired up to @magnus-flipper-ai/profit-engine package
 */

import { getMonthlyPnLTrend } from "@magnus-flipper-ai/profit-engine/ledger/profitLedger";

export async function getProfitTrend(userId: string) {
  try {
    return await getMonthlyPnLTrend(userId);
  } catch (error) {
    console.error("Error fetching profit trend:", error);
    throw error;
  }
}

