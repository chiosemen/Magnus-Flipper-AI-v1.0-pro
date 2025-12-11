"use client";

import { EarningsChart } from "../components/EarningsChart";
import { MetricsSummaryBar } from "../components/MetricsSummaryBar";
import { Button } from "../../../components/ui/button";
import { Stack } from "../../../components/ui/stack";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { mockEarnings7d, mockEarnings30d, mockMetrics } from "../lib/mockData";
import { useState } from "react";

export default function EarningsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("7d");

  const earningsData =
    period === "7d" ? mockEarnings7d : period === "30d" ? mockEarnings30d : mockEarnings7d;

  const metrics = [
    mockMetrics.totalEarnings,
    {
      label: "This Month",
      value: "$8,450.25",
      change: "+15.2%",
      changeType: "positive" as const,
    },
    {
      label: "Avg. Daily",
      value: "$281.68",
      change: "+5.1%",
      changeType: "positive" as const,
    },
    {
      label: "Pending",
      value: "$1,250.00",
      change: null,
      changeType: "neutral" as const,
    },
  ];

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 space-y-6">
      <Stack direction="column" spacing={6}>
        {/* Header */}
        <Stack direction="row" justify="between" align="center" className="flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Earnings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your affiliate earnings and performance
            </p>
          </div>
          <Button variant="outline">Export Report</Button>
        </Stack>

        {/* Metrics Summary */}
        <MetricsSummaryBar metrics={metrics} />

        {/* Period Selector */}
        <Stack direction="row" spacing={2} className="flex-wrap">
          <Button
            variant={period === "7d" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("7d")}
          >
            7 Days
          </Button>
          <Button
            variant={period === "30d" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("30d")}
          >
            30 Days
          </Button>
          <Button
            variant={period === "90d" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("90d")}
          >
            90 Days
          </Button>
          <Button
            variant={period === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod("all")}
          >
            All Time
          </Button>
        </Stack>

        {/* Earnings Chart */}
        <EarningsChart data={earningsData} period={period} />

        {/* Additional Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performing Link</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack direction="column" spacing={2}>
                <p className="text-sm text-muted-foreground">Homepage Referral</p>
                <p className="text-2xl font-bold">$12,540.50</p>
                <p className="text-xs text-muted-foreground">342 conversions</p>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack direction="column" spacing={2}>
                <p className="text-sm text-muted-foreground">Overall</p>
                <p className="text-2xl font-bold">2.4%</p>
                <p className="text-xs text-success">+0.3% from last month</p>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Next Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <Stack direction="column" spacing={2}>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-bold">$1,250.00</p>
                <p className="text-xs text-muted-foreground">Due in 5 days</p>
              </Stack>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Earnings</CardTitle>
            <CardDescription>Your latest affiliate earnings transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { date: "2024-12-10", amount: 450.25, source: "Homepage Referral" },
                { date: "2024-12-09", amount: 520.50, source: "Product Page" },
                { date: "2024-12-08", amount: 380.75, source: "Blog Post" },
                { date: "2024-12-07", amount: 610.00, source: "Landing Page" },
              ].map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{transaction.source}</p>
                    <p className="text-sm text-muted-foreground">{transaction.date}</p>
                  </div>
                  <p className="font-bold">${transaction.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Stack>
    </div>
  );
}
