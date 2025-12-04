"use client";

/**
 * Profit Chart Component
 * Displays monthly profit trend chart
 */

// Recharts temporarily disabled - package not installed
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
}

interface ProfitChartProps {
  data: MonthlyData[];
  loading?: boolean;
}

export function ProfitChart({ data, loading = false }: ProfitChartProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Monthly Profit Trend
      </h3>

      {/* Chart placeholder - recharts not installed */}
      <div className="h-64 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
        <p className="text-gray-500 dark:text-gray-400">Chart placeholder - install recharts to enable</p>
      </div>
    </div>
  );
}
