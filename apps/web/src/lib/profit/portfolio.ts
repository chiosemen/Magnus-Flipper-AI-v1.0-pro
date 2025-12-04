// apps/web/src/lib/profit/portfolio.ts

/**
 * Portfolio wrapper
 * Wired up to @magnus-flipper-ai/profit-engine package
 */

import { createPortfolioSnapshot } from "@magnus-flipper-ai/profit-engine/ledger/portfolioEngine";

export async function getPortfolioSnapshot(userId: string) {
  try {
    return await createPortfolioSnapshot(userId);
  } catch (error) {
    console.error("Error creating portfolio snapshot:", error);
    throw error;
  }
}

