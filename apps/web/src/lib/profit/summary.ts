// apps/web/src/lib/profit/summary.ts

/**
 * Profit summary wrapper
 * Wired up to @magnus-flipper-ai/profit-engine package
 */

import { calculatePnL } from "@magnus-flipper-ai/profit-engine/ledger/profitLedger";

export async function calculateProfitSummary(
  userId: string,
  startDate: string,
  endDate: string
) {
  try {
    return await calculatePnL(userId, startDate, endDate);
  } catch (error) {
    console.error("Error calculating profit summary:", error);
    throw error;
  }
}

