/**
 * Scraper Monitor Service
 * Tracks scraper health, performance, and failures
 * 
 * This service is lightweight and only queries Supabase.
 * It does not include any browser automation dependencies.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  ScraperResult,
  ScraperHealthMetrics,
} from "../types/scraper.js";

export class ScraperMonitor {
  private supabase: SupabaseClient;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Log scraper execution
   */
  async logScraperRun(result: ScraperResult): Promise<void> {
    try {
      await this.supabase.from("scraper_logs").insert({
        marketplace: result.marketplace,
        started_at: result.started_at,
        completed_at: result.completed_at,
        duration_ms: result.duration_ms,
        success: result.success,
        total_scraped: result.total_scraped,
        errors: result.errors,
        created_at: new Date().toISOString(),
      });

      // Update health metrics
      await this.updateHealthMetrics(result);
    } catch (error: any) {
      console.error(`Error logging scraper run: ${error.message}`);
    }
  }

  /**
   * Update scraper health metrics
   */
  private async updateHealthMetrics(result: ScraperResult): Promise<void> {
    // Get existing metrics
    const { data: existing } = await this.supabase
      .from("scraper_health")
      .select("*")
      .eq("marketplace", result.marketplace)
      .single();

    const now = new Date().toISOString();

    if (existing) {
      // Calculate updated metrics
      const totalRuns = existing.total_runs + 1;
      const successfulRuns = result.success
        ? existing.successful_runs + 1
        : existing.successful_runs;
      const failedRuns = result.success
        ? existing.failed_runs
        : existing.failed_runs + 1;

      // Calculate rolling averages
      const avgItems =
        (existing.avg_items_per_run * existing.total_runs +
          result.total_scraped) /
        totalRuns;
      const avgDuration =
        (existing.avg_duration_ms * existing.total_runs + result.duration_ms) /
        totalRuns;

      const errorRate = failedRuns / totalRuns;

      // Determine status
      let status: "healthy" | "degraded" | "down" = "healthy";
      if (errorRate > 0.5) {
        status = "down";
      } else if (errorRate > 0.2 || avgItems < 5) {
        status = "degraded";
      }

      // Update
      await this.supabase
        .from("scraper_health")
        .update({
          status,
          last_run_at: now,
          last_success_at: result.success ? now : existing.last_success_at,
          total_runs: totalRuns,
          successful_runs: successfulRuns,
          failed_runs: failedRuns,
          avg_items_per_run: Math.round(avgItems),
          avg_duration_ms: Math.round(avgDuration),
          error_rate: Math.round(errorRate * 100) / 100,
          last_error: result.success
            ? existing.last_error
            : result.errors.join("; "),
          updated_at: now,
        })
        .eq("marketplace", result.marketplace);
    } else {
      // Create new metrics
      await this.supabase.from("scraper_health").insert({
        marketplace: result.marketplace,
        status: result.success ? "healthy" : "degraded",
        last_run_at: now,
        last_success_at: result.success ? now : null,
        total_runs: 1,
        successful_runs: result.success ? 1 : 0,
        failed_runs: result.success ? 0 : 1,
        avg_items_per_run: result.total_scraped,
        avg_duration_ms: result.duration_ms,
        error_rate: result.success ? 0 : 1.0,
        last_error: result.success ? null : result.errors.join("; "),
        created_at: now,
        updated_at: now,
      });
    }
  }

  /**
   * Get health metrics for all scrapers
   */
  async getAllHealthMetrics(): Promise<ScraperHealthMetrics[]> {
    const { data, error } = await this.supabase
      .from("scraper_health")
      .select("*")
      .order("marketplace");

    if (error) {
      console.error(`Error fetching health metrics: ${error.message}`);
      return [];
    }

    return (data || []).map((row) => ({
      marketplace: row.marketplace,
      status: row.status,
      last_run_at: row.last_run_at,
      last_success_at: row.last_success_at,
      total_runs: row.total_runs,
      successful_runs: row.successful_runs,
      failed_runs: row.failed_runs,
      avg_items_per_run: row.avg_items_per_run,
      avg_duration_ms: row.avg_duration_ms,
      error_rate: row.error_rate,
      last_error: row.last_error,
    }));
  }

  /**
   * Get health metrics for a specific marketplace
   */
  async getHealthMetrics(
    marketplace: string
  ): Promise<ScraperHealthMetrics | null> {
    const { data, error } = await this.supabase
      .from("scraper_health")
      .select("*")
      .eq("marketplace", marketplace)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      marketplace: data.marketplace,
      status: data.status,
      last_run_at: data.last_run_at,
      last_success_at: data.last_success_at,
      total_runs: data.total_runs,
      successful_runs: data.successful_runs,
      failed_runs: data.failed_runs,
      avg_items_per_run: data.avg_items_per_run,
      avg_duration_ms: data.avg_duration_ms,
      error_rate: data.error_rate,
      last_error: data.last_error,
    };
  }

  /**
   * Get recent scraper logs
   */
  async getRecentLogs(
    marketplace?: string,
    limit: number = 50
  ): Promise<any[]> {
    let query = this.supabase
      .from("scraper_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);

    if (marketplace) {
      query = query.eq("marketplace", marketplace);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error fetching logs: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Get scraper performance statistics
   */
  async getPerformanceStats(marketplace: string): Promise<any> {
    const { data, error } = await this.supabase
      .from("scraper_logs")
      .select("duration_ms, total_scraped, success")
      .eq("marketplace", marketplace)
      .order("started_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return null;
    }

    const successful = data.filter((log) => log.success);
    const avgDuration =
      successful.reduce((sum, log) => sum + log.duration_ms, 0) /
        successful.length || 0;
    const avgScraped =
      successful.reduce((sum, log) => sum + log.total_scraped, 0) /
        successful.length || 0;
    const successRate = successful.length / data.length;

    return {
      marketplace,
      total_runs: data.length,
      successful_runs: successful.length,
      success_rate: Math.round(successRate * 100),
      avg_duration_ms: Math.round(avgDuration),
      avg_items_scraped: Math.round(avgScraped),
      items_per_second: avgDuration > 0 ? avgScraped / (avgDuration / 1000) : 0,
    };
  }

  /**
   * Check if any scrapers are down
   */
  async checkScraperHealth(): Promise<{
    healthy: string[];
    degraded: string[];
    down: string[];
  }> {
    const metrics = await this.getAllHealthMetrics();

    const result = {
      healthy: [] as string[],
      degraded: [] as string[],
      down: [] as string[],
    };

    for (const metric of metrics) {
      if (metric.status === "healthy") {
        result.healthy.push(metric.marketplace);
      } else if (metric.status === "degraded") {
        result.degraded.push(metric.marketplace);
      } else {
        result.down.push(metric.marketplace);
      }
    }

    return result;
  }

  /**
   * Alert if scrapers haven't run recently
   */
  async checkStaleScrapers(hoursStale: number = 24): Promise<string[]> {
    const cutoffTime = new Date(
      Date.now() - hoursStale * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await this.supabase
      .from("scraper_health")
      .select("marketplace, last_run_at")
      .lt("last_run_at", cutoffTime);

    if (error) {
      console.error(`Error checking stale scrapers: ${error.message}`);
      return [];
    }

    return (data || []).map((row) => row.marketplace);
  }
}
