"use client";

/**
 * EV Accuracy Metrics Component
 * Displays accuracy of resale predictions vs actual sales
 */

import { TargetIcon, TrendingUpIcon } from "lucide-react";

interface EVAccuracyMetricsProps {
  totalCorrections: number;
  avgVariance: number;
  avgCorrectionFactor: number;
  topCategory?: string;
  topCategoryAccuracy?: number;
  loading?: boolean;
}

export function EVAccuracyMetrics({
  totalCorrections,
  avgVariance,
  avgCorrectionFactor,
  topCategory,
  topCategoryAccuracy,
  loading = false,
}: EVAccuracyMetricsProps) {
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

  const accuracy = 100 - Math.abs(avgVariance);
  const isAccurate = accuracy >= 80;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Prediction Accuracy
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall Accuracy */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg ${
              isAccurate
                ? "bg-green-100 dark:bg-green-900"
                : "bg-yellow-100 dark:bg-yellow-900"
            }`}
          >
            <TargetIcon
              className={`w-6 h-6 ${
                isAccurate
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Overall Accuracy
            </p>
            <p
              className={`text-2xl font-bold ${
                isAccurate
                  ? "text-green-600 dark:text-green-400"
                  : "text-yellow-600 dark:text-yellow-400"
              }`}
            >
              {accuracy.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Based on {totalCorrections} sales
            </p>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <TrendingUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Correction Factor
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {avgCorrectionFactor.toFixed(3)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Bayesian learning
            </p>
          </div>
        </div>
      </div>

      {/* Category Accuracy */}
      {topCategory && topCategoryAccuracy && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Most Accurate Category
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {topCategory}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {topCategoryAccuracy.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Average Variance */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Avg Price Variance
          </span>
          <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
            ${Math.abs(avgVariance).toFixed(2)}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              Math.abs(avgVariance) < 10
                ? "bg-green-500"
                : Math.abs(avgVariance) < 20
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{
              width: `${Math.min((Math.abs(avgVariance) / 50) * 100, 100)}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
