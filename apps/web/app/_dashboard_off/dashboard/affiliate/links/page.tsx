"use client";

import { AffiliateLinkTable } from "../components/AffiliateLinkTable";
import { MetricsSummaryBar } from "../components/MetricsSummaryBar";
import { Button } from "@/components/ui/button";
import { Stack } from "@/components/ui/stack";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mockLinks, mockMetrics } from "../lib/mockData";
import { useState } from "react";

export default function AffiliateLinksPage() {
  const [links, setLinks] = useState(mockLinks);

  const handleCopy = (url: string) => {
    // In production, show toast notification
    console.log("Copied:", url);
  };

  const handleEdit = (id: string) => {
    // In production, open edit modal/drawer
    console.log("Edit link:", id);
  };

  const handleToggleStatus = (id: string) => {
    setLinks((prev) =>
      prev.map((link) =>
        link.id === id
          ? { ...link, status: link.status === "active" ? "paused" : "active" }
          : link
      )
    );
  };

  const metrics = [
    mockMetrics.totalClicks,
    mockMetrics.conversionRate,
    { label: "Total Links", value: links.length.toString() },
    { label: "Active Links", value: links.filter((l) => l.status === "active").length.toString() },
  ];

  return (
    <div className="container mx-auto py-4 sm:py-6 lg:py-8 space-y-6">
      <Stack direction="column" spacing={6}>
        {/* Header */}
        <Stack direction="row" justify="between" align="center" className="flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Affiliate Links</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track your affiliate links
            </p>
          </div>
          <Button>Create New Link</Button>
        </Stack>

        {/* Metrics Summary */}
        <MetricsSummaryBar metrics={metrics} />

        {/* Links Table */}
        <AffiliateLinkTable
          links={links}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Overview of your affiliate link performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${links.reduce((sum, link) => sum + link.revenue, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">
                  {links.reduce((sum, link) => sum + link.clicks, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-2xl font-bold">
                  {links.reduce((sum, link) => sum + link.conversions, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. CTR</p>
                <p className="text-2xl font-bold">
                  {(
                    (links.reduce((sum, link) => sum + link.conversions, 0) /
                      links.reduce((sum, link) => sum + link.clicks, 1)) *
                    100
                  ).toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Stack>
    </div>
  );
}
