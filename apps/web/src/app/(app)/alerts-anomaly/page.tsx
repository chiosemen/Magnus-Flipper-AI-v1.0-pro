"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MarketplaceAnomaly {
  marketplace: string;
  total_alerts_last_24h: number;
  total_alerts_prev_24h: number;
  avg_alerts_per_day_last_7d: number;
  anomaly_score: number;
  anomaly_label: "SPIKE" | "DROP" | "NORMAL";
}

interface AnomalyResponse {
  byMarketplace: MarketplaceAnomaly[];
  generated_at: string;
  note?: string;
}

export default function AlertsAnomalyPage() {
  const [data, setData] = useState<AnomalyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnomalyData();
  }, []);

  async function fetchAnomalyData() {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/alerts-anomaly`);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      console.error("Error fetching anomaly data:", err);
      setError(err.message || "Failed to load anomaly data");
    } finally {
      setLoading(false);
    }
  }

  const getAnomalyBadge = (label: string) => {
    switch (label) {
      case "SPIKE":
        return (
          <Badge className="bg-red-500/10 text-red-400 border-red-500/30">
            <TrendingUp className="h-3 w-3 mr-1" />
            SPIKE
          </Badge>
        );
      case "DROP":
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            <TrendingDown className="h-3 w-3 mr-1" />
            DROP
          </Badge>
        );
      default:
        return (
          <Badge className="bg-green-500/10 text-green-400 border-green-500/30">
            <Activity className="h-3 w-3 mr-1" />
            NORMAL
          </Badge>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 1.0) return "text-red-400";
    if (score <= -1.0) return "text-blue-400";
    return "text-green-400";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Alerts Anomaly Radar</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading anomaly data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Alerts Anomaly Radar</h1>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.byMarketplace.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Alerts Anomaly Radar</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No alert anomaly data yet</p>
              <p className="text-sm mt-2">
                {data?.note || "Anomaly detection requires at least 7 days of alert history."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const spikes = data.byMarketplace.filter((m) => m.anomaly_label === "SPIKE").length;
  const drops = data.byMarketplace.filter((m) => m.anomaly_label === "DROP").length;
  const normal = data.byMarketplace.filter((m) => m.anomaly_label === "NORMAL").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Alerts Anomaly Radar</h1>
        <p className="text-muted-foreground mt-1">
          Real-time anomaly detection for marketplace alert activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Marketplaces Monitored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.byMarketplace.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Spikes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{spikes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{drops}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Normal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{normal}</div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplaces Table */}
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.byMarketplace.map((marketplace) => (
              <Card
                key={marketplace.marketplace}
                className="border-slate-800 bg-slate-950/80"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg capitalize">
                          {marketplace.marketplace.toLowerCase().replace(/_/g, " ")}
                        </h3>
                        {getAnomalyBadge(marketplace.anomaly_label)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Last 24h</p>
                          <p className="font-semibold text-lg">
                            {marketplace.total_alerts_last_24h}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground text-xs">Previous 24h</p>
                          <p className="font-semibold text-lg">
                            {marketplace.total_alerts_prev_24h}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground text-xs">7d Daily Avg</p>
                          <p className="font-semibold text-lg">
                            {marketplace.avg_alerts_per_day_last_7d.toFixed(1)}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground text-xs">Anomaly Score</p>
                          <p
                            className={`font-semibold text-lg ${getScoreColor(
                              marketplace.anomaly_score
                            )}`}
                          >
                            {marketplace.anomaly_score >= 0 ? "+" : ""}
                            {marketplace.anomaly_score.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Last updated: {new Date(data.generated_at).toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
