/**
 * Profit Engine Package Entry Point
 * Export all public APIs
 */

// Auto-Sell Engine (Agent E)
export {
  detectSales,
  EbaySaleDetector,
  VintedSaleDetector,
  DepopSaleDetector,
  FacebookSaleDetector,
  OfferUpSaleDetector,
  type MarketplaceSalePoller,
} from "./autosell/saleDetector.js";

export {
  lockListingAcrossPlatforms,
  unlockListingAcrossPlatforms,
  type ActiveListing,
  type LockResult,
} from "./autosell/crossPlatformLock.js";

export {
  finalizeSale,
  finalizeSalesBatch,
  updateSaleStatus,
  processRefund,
  type FinalizationResult,
} from "./autosell/finalizeSale.js";

// Profit Ledger Engine (Agent F)
export {
  calculateMarketplaceFees,
  calculateNetProceeds,
  calculateMinimumPrice,
  compareMarketplaceFees,
  getBestMarketplace,
  calculateBreakEvenPrice,
  type FeeBreakdown,
} from "./ledger/feeModel.js";

export {
  calculatePnL,
  getLedgerEntries,
  createLedgerEntry,
  getCurrentMonthPnL,
  getCurrentYearPnL,
  getAllTimePnL,
  getMonthlyPnLTrend,
  getTopPerformingItems,
  getWorstPerformingItems,
  calculateLTV,
} from "./ledger/profitLedger.js";

export {
  correctEV,
  getCorrectionInsights,
  applyEVCorrection,
  getAllHistoricalStats,
  calculateModelAccuracy,
} from "./ledger/evCorrector.js";

export {
  createPortfolioSnapshot,
  getPortfolioHistory,
  getCurrentPortfolio,
  getInventoryAging,
  getMarketplaceDistribution,
  calculateCashFlowProjection,
} from "./ledger/portfolioEngine.js";

// Schemas
export type {
  SaleEvent,
  FinalizedSale,
  LedgerEntry,
  EVCorrection,
  PortfolioSnapshot,
  PnLSummary,
  HistoricalStats,
} from "./schemas/SaleEvent.js";

export {
  SaleEventSchema,
  FinalizedSaleSchema,
  LedgerEntrySchema,
  EVCorrectionSchema,
  PortfolioSnapshotSchema,
} from "./schemas/SaleEvent.js";
