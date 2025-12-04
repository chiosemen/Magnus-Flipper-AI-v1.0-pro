"use client";

/**
 * P&L Summary Card Component
 * Displays profit and loss summary with key metrics
 */

import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface PnLSummaryCardProps {
  totalRevenue: number;
  totalCosts: number;
  netProfit: number;
  roi: number;
  winRate: number;
  avgHoldingTime: number;
  loading?: boolean;
}

export function PnLSummaryCard({
  totalRevenue,
  totalCosts,
  netProfit,
  roi,
  winRate,
  avgHoldingTime,
  loading = false,
}: PnLSummaryCardProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const isProfitable = netProfit >= 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        P&L Summary
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Profit */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Net Profit
          </p>
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl font-bold ${
                isProfitable
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              ${netProfit.toFixed(2)}
            </span>
            {isProfitable ? (
              <ArrowUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <ArrowDownIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
          </div>
        </div>

        {/* ROI */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ROI</p>
          <span
            className={`text-2xl font-bold ${
              roi >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {roi.toFixed(1)}%
          </span>
        </div>

        {/* Win Rate */}
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Win Rate
          </p>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {winRate.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total Revenue
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Total Costs
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            ${totalCosts.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Avg Holding Time
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {avgHoldingTime} days
          </p>
        </div>
      </div>
    </div>
  );
}
