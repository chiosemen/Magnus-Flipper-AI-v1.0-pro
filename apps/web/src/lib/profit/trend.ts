// apps/web/src/lib/profit/trend.ts

/**
 * Profit trend wrapper
 * Wired up to @magnus-flipper-ai/profit-engine package
 */

// Local stub (profit-engine package not available in web build)
async function getMonthlyPnLTrend(userId: string): Promise<any[]> {
  // Stub implementation
  return [];
}

export async function getProfitTrend(userId: string) {
  try {
    return await getMonthlyPnLTrend(userId);
  } catch (error) {
    console.error("Error fetching profit trend:", error);
    throw error;
  }
}

