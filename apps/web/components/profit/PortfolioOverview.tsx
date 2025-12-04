"use client";

/**
 * Portfolio Overview Component
 * Bloomberg Terminal-style portfolio tracking
 */

import { TrendingUpIcon, PackageIcon, DollarSignIcon } from "lucide-react";

interface PortfolioOverviewProps {
  totalInventoryValue: number;
  totalInvestedCapital: number;
  totalRealizedProfit: number;
  totalUnrealizedProfit: number;
  activeListings: number;
  soldItems: number;
  portfolioROI: number;
  bestPerformingCategory: string;
  worstPerformingCategory: string;
  loading?: boolean;
}

export function PortfolioOverview({
  totalInventoryValue,
  totalInvestedCapital,
  totalRealizedProfit,
  totalUnrealizedProfit,
  activeListings,
  soldItems,
  portfolioROI,
  bestPerformingCategory,
  worstPerformingCategory,
  loading = false,
}: PortfolioOverviewProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Portfolio Overview
      </h3>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <DollarSignIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Inventory Value
            </p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ${totalInventoryValue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Invested: ${totalInvestedCapital.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <TrendingUpIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Realized Profit
            </p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              ${totalRealizedProfit.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ROI: {portfolioROI.toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <PackageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Unrealized Profit
            </p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
              ${totalUnrealizedProfit.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {activeListings} active listings
            </p>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Active Listings
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {activeListings}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Sold Items</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {soldItems}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Best Category
          </p>
          <p className="text-sm font-medium text-green-600 dark:text-green-400 capitalize">
            {bestPerformingCategory || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Worst Category
          </p>
          <p className="text-sm font-medium text-red-600 dark:text-red-400 capitalize">
            {worstPerformingCategory || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
