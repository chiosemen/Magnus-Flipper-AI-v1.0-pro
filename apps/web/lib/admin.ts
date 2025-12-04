import { createSupabaseServer } from "./supabase/server";
import { getSignedInUser, SignedInUser } from "./session";
import { SubscriptionTier } from "@/types/subscription";
import { redirect } from "next/navigation";

export async function requireAdmin(): Promise<SignedInUser> {
  const user = await getSignedInUser();

  if (!user || user.tier !== SubscriptionTier.ADMIN) {
    redirect("/login");
  }

  return user;
}

export async function getMarketplaceSettings() {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("marketplace_settings")
    .select("*")
    .order("marketplace");

  if (error) {
    console.error("Error fetching marketplace settings:", error);
    return [];
  }

  return data;
}

export async function toggleMarketplace(marketplace: string, enabled: boolean) {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("marketplace_settings")
    .update({
      enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("marketplace", marketplace);

  if (error) {
    console.error("Error toggling marketplace:", error);
    throw error;
  }

  return { success: true };
}

export async function getScannerTelemetry() {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("scanner_telemetry")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching scanner telemetry:", error);
    return [];
  }

  return data;
}

export async function getJobStats() {
  const supabase = await createSupabaseServer();

  const { data: jobs, error } = await supabase
    .from("job_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching job stats:", error);
    return { jobs: [], workers: [] };
  }

  const { data: workers } = await supabase
    .from("worker_heartbeat")
    .select("*")
    .order("last_heartbeat", { ascending: false });

  return { jobs: jobs || [], workers: workers || [] };
}

export async function getTelemetryMetrics() {
  const supabase = await createSupabaseServer();

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count: totalProcessed } = await supabase
    .from("scanner_telemetry")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneDayAgo);

  const { count: errorCount } = await supabase
    .from("scanner_telemetry")
    .select("*", { count: "exact", head: true })
    .eq("success", false)
    .gte("created_at", oneDayAgo);

  const { data: latencyData } = await supabase
    .from("scanner_telemetry")
    .select("latency_ms")
    .not("latency_ms", "is", null)
    .gte("created_at", oneDayAgo)
    .limit(1000);

  const avgLatency = latencyData && latencyData.length > 0
    ? Math.round(latencyData.reduce((sum, row) => sum + (row.latency_ms || 0), 0) / latencyData.length)
    : 0;

  const successRate = totalProcessed && errorCount !== null
    ? ((totalProcessed - errorCount) / totalProcessed * 100).toFixed(1)
    : "0.0";

  const { count: queueDepth } = await supabase
    .from("job_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: activeScannersCount } = await supabase
    .from("worker_heartbeat")
    .select("*", { count: "exact", head: true })
    .eq("status", "online");

  return {
    activeScanners: activeScannersCount || 0,
    totalProcessed: totalProcessed || 0,
    errorsLast24h: errorCount || 0,
    avgLatency,
    successRate,
    queueDepth: queueDepth || 0,
  };
}
