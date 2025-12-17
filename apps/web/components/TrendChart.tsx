"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type TrendDataPoint = {
  timestamp: string;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  count: number;
};

type TrendChartProps = {
  data: TrendDataPoint[];
  searchId: string;
};

export function TrendChart({ data, searchId }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No trend data available yet
      </div>
    );
  }

  // Format data for Recharts (sort by timestamp, format dates)
  const chartData = [...data]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((point) => ({
      ...point,
      date: new Date(point.timestamp).toLocaleDateString(),
      time: new Date(point.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: "Price", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            formatter={(value: number | undefined, name: string) => {
              if (typeof value !== "number") return ["—", name];
              if (name === "medianPrice") return [`£${value.toFixed(2)}`, "Median Price"];
              if (name === "minPrice") return [`£${value.toFixed(2)}`, "Min Price"];
              if (name === "maxPrice") return [`£${value.toFixed(2)}`, "Max Price"];
              return [`£${value.toFixed(2)}`, name];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="medianPrice"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Median Price"
          />
          <Line
            type="monotone"
            dataKey="minPrice"
            stroke="#3b82f6"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            name="Min Price"
          />
          <Line
            type="monotone"
            dataKey="maxPrice"
            stroke="#ef4444"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            name="Max Price"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
