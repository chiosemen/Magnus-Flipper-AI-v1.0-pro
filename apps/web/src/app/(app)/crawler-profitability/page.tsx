"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Activity, AlertCircle } from "lucide-react";

interface MarketplaceProfitability {
  marketplace: string;
  total_runs: number;
  total_hits: number;
  avg_hits_per_run: number;
  estimated_value_score: number;
}

interface SearchProfitability {
  search_id: string;
  label: string;
  marketplace: string;
  total_runs: number;
  total_hits: number;
  avg_hits_per_run: number;
  estimated_value_score: number;
}

interface ProfitabilityResponse {
  byMarketplace: MarketplaceProfitability[];
  bySearch: SearchProfitability[];
  generated_at: string;
  note?: string;
}

export default function CrawlerProfitabilityPage() {
  const [data, setData] = useState<ProfitabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfitabilityData();
  }, []);

  async function fetchProfitabilityData() {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${baseUrl}/api/crawler-profitability`);

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }

      const json = await response.json();
      setData(json);
    } catch (err: any) {
      console.error("Error fetching profitability data:", err);
      setError(err.message || "Failed to load profitability data");
    } finally {
      setLoading(false);
    }
  }

  const getHeatmapColor = (score: number, maxScore: number) => {
    if (maxScore === 0) return "bg-slate-800";

    const intensity = score / maxScore;

    if (intensity >= 0.8) return "bg-emerald-500/30 border-emerald-500/50";
    if (intensity >= 0.6) return "bg-emerald-500/20 border-emerald-500/40";
    if (intensity >= 0.4) return "bg-cyan-500/20 border-cyan-500/40";
    if (intensity >= 0.2) return "bg-blue-500/20 border-blue-500/40";
    return "bg-slate-500/10 border-slate-500/30";
  };

  const getValueColor = (score: number) => {
    if (score >= 100) return "text-emerald-400";
    if (score >= 50) return "text-cyan-400";
    if (score >= 20) return "text-blue-400";
    return "text-slate-400";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Crawler Profitability Heatmap</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading profitability data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Crawler Profitability Heatmap</h1>
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
        <h1 className="text-3xl font-bold">Crawler Profitability Heatmap</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No profitability data yet</p>
              <p className="text-sm mt-2">
                {data?.note || "Run some searches to see profitability metrics."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const maxScore = Math.max(...data.byMarketplace.map(m => m.estimated_value_score), 1);
  const totalRuns = data.byMarketplace.reduce((sum, m) => sum + m.total_runs, 0);
  const totalHits = data.byMarketplace.reduce((sum, m) => sum + m.total_hits, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crawler Profitability Heatmap</h1>
        <p className="text-muted-foreground mt-1">
          Analytics showing which marketplaces and searches drive the most value
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Crawler Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRuns.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hits Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{totalHits.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Marketplaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-400">{data.byMarketplace.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Marketplace Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Marketplace Performance Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.byMarketplace.map((marketplace) => (
              <Card
                key={marketplace.marketplace}
                className={`border transition-all ${getHeatmapColor(
                  marketplace.estimated_value_score,
                  maxScore
                )}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg capitalize">
                      {marketplace.marketplace.toLowerCase().replace(/_/g, " ")}
                    </h3>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">
                      Score: {marketplace.estimated_value_score.toFixed(1)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Runs</p>
                      <p className="text-xl font-bold">{marketplace.total_runs}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Hits</p>
                      <p className="text-xl font-bold text-emerald-400">
                        {marketplace.total_hits}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Avg Hits/Run</p>
                      <p className="text-xl font-bold text-cyan-400">
                        {marketplace.avg_hits_per_run.toFixed(1)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Value Score</p>
                      <p className={`text-xl font-bold ${getValueColor(marketplace.estimated_value_score)}`}>
                        {marketplace.estimated_value_score.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* Visual progress bar */}
                  <div className="mt-3">
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                        style={{
                          width: `${(marketplace.estimated_value_score / maxScore) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Searches Table */}
      {data.bySearch.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Performing Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Search</th>
                    <th className="pb-3 font-medium">Marketplace</th>
                    <th className="pb-3 font-medium text-right">Runs</th>
                    <th className="pb-3 font-medium text-right">Hits</th>
                    <th className="pb-3 font-medium text-right">Avg Hits/Run</th>
                    <th className="pb-3 font-medium text-right">Value Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bySearch.map((search, idx) => (
                    <tr
                      key={`${search.search_id}_${search.marketplace}`}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{search.label}</span>
                          {idx < 3 && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/40 text-xs">
                              Top {idx + 1}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className="capitalize">
                          {search.marketplace.toLowerCase().replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-medium">{search.total_runs}</td>
                      <td className="py-3 text-right font-medium text-emerald-400">
                        {search.total_hits}
                      </td>
                      <td className="py-3 text-right font-medium text-cyan-400">
                        {search.avg_hits_per_run.toFixed(1)}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`font-bold ${getValueColor(search.estimated_value_score)}`}>
                          {search.estimated_value_score.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card className="border-slate-800/50">
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Value Score Formula:</p>
            <code className="text-xs bg-slate-800/50 px-2 py-1 rounded">
              (Total Hits × 2) + (Avg Hits per Run × 5)
            </code>
            <p className="mt-3 text-xs">
              Last updated: {new Date(data.generated_at).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
