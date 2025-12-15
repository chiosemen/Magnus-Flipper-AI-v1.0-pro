"use client";

import { CreativesGrid } from "../components/CreativesGrid";
import { MetricsSummaryBar } from "../components/MetricsSummaryBar";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCreatives, mockMetrics } from "../lib/mockData";
import { useState } from "react";

export default function CreativesPage() {
  const [creatives, setCreatives] = useState(mockCreatives);

  const handleEdit = (id: string) => {
    // In production, open edit modal/drawer
    console.log("Edit creative:", id);
  };

  const handleToggleStatus = (id: string) => {
    setCreatives((prev) =>
      prev.map((creative) =>
        creative.id === id
          ? {
              ...creative,
              status:
                creative.status === "active"
                  ? "paused"
                  : creative.status === "paused"
                  ? "active"
                  : "active",
            }
          : creative
      )
    );
  };

  const metrics = [
    {
      label: "Total Creatives",
      value: creatives.length.toString(),
    },
    {
      label: "Active Creatives",
      value: creatives.filter((c) => c.status === "active").length.toString(),
    },
    {
      label: "Total Clicks",
      value: creatives.reduce((sum, c) => sum + c.clicks, 0).toLocaleString(),
    },
    {
      label: "Avg. CTR",
      value:
        (
          creatives.reduce((sum, c) => sum + c.ctr, 0) / creatives.length || 0
        ).toFixed(2) + "%",
    },
  ];

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 space-y-6">
      <Stack direction="column" spacing={6}>
        {/* Header */}
        <Stack direction="row" justify="between" align="center" className="flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Creatives</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your affiliate marketing creatives
            </p>
          </div>
          <Button>Create New Creative</Button>
        </Stack>

        {/* Metrics Summary */}
        <MetricsSummaryBar metrics={metrics} />

        {/* Creatives Grid */}
        <CreativesGrid
          creatives={creatives}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>
              Overall performance metrics for all creatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">
                  {creatives.reduce((sum, c) => sum + c.conversions, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Performing</p>
                <p className="text-2xl font-bold">
                  {creatives.reduce((best, c) => (c.ctr > best.ctr ? c : best), creatives[0])?.name ||
                    "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">
                  {creatives.reduce((sum, c) => sum + c.clicks, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Stack>
    </div>
  );
}
