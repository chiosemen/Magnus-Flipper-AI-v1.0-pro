// apps/web/src/lib/admin/marketplaces.ts

/**
 * Marketplace settings integration
 * Queries and updates Supabase marketplace_settings table
 * 
 * NOTE: No engine function exists for marketplace settings management.
 * This wrapper queries Supabase directly which is the source of truth.
 * 
 * PERFORMANCE: Uses React cache() for request-level deduplication
 */

import { cache } from "@/lib/react-cache";
import { createServerClient } from "@/lib/supabase";
import { withTrace, logError } from "@/lib/observability/logger";
import { createTraceContext } from "@/lib/observability/correlation";
import { recordLatency } from "@/lib/observability/metrics";

const getMarketplaceSettingsInternal = cache(async () => {
  const context = await createTraceContext({ module: "admin/marketplaces" });
  
  return withTrace(async () => {
    const start = performance.now();
    const supabase = await createServerClient();

    const { data: settings, error } = await supabase
      .from("marketplace_settings")
      .select("id, marketplace, enabled, api_health, last_sync, updated_at")
      .order("marketplace");

    if (error) {
      logError("Error fetching marketplace settings", { ...context, error });
      throw error;
    }

    // Transform to expected format - return array for UI compatibility
    // Also support Record format for backward compatibility
    const arrayFormat = (settings || []).map((setting) => ({
      id: setting.id || setting.marketplace,
      marketplace: setting.marketplace,
      enabled: setting.enabled,
      api_health: (setting.api_health as "healthy" | "degraded" | "down") || "healthy",
      last_sync: setting.last_sync || null,
      updated_at: setting.updated_at,
    }));

    // PERFORMANCE: Record wrapper execution latency
    const duration = performance.now() - start;
    recordLatency("wrapper.admin.marketplaces.getMarketplaceSettings", Math.round(duration));
    
    // Return array format (UI expects this)
    return arrayFormat;
  }, context).catch((error) => {
    logError("ADMIN MARKETPLACES ERROR: getMarketplaceSettings failed", { ...context, error });
    // Return default fallback on error (array format)
    return [
      { id: "ebay", marketplace: "ebay", enabled: true, api_health: "healthy" as const, last_sync: null, updated_at: new Date().toISOString() },
      { id: "facebook", marketplace: "facebook", enabled: true, api_health: "healthy" as const, last_sync: null, updated_at: new Date().toISOString() },
      { id: "gumtree", marketplace: "gumtree", enabled: true, api_health: "healthy" as const, last_sync: null, updated_at: new Date().toISOString() },
      { id: "vinted", marketplace: "vinted", enabled: true, api_health: "healthy" as const, last_sync: null, updated_at: new Date().toISOString() },
      { id: "craigslist", marketplace: "craigslist", enabled: false, api_health: "healthy" as const, last_sync: null, updated_at: new Date().toISOString() },
    ];
  });
});

export const getMarketplaceSettings = getMarketplaceSettingsInternal;

export async function toggleMarketplace(marketplace: string, enabled: boolean) {
  const context = await createTraceContext({ module: "admin/marketplaces", marketplace, enabled });
  
  return withTrace(async () => {
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from("marketplace_settings")
      .upsert(
        {
          marketplace,
          enabled,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "marketplace",
        }
      )
      .select()
      .single();

    if (error) {
      logError("Error toggling marketplace", { ...context, error });
      throw error;
    }

    return { success: true, marketplace, enabled };
  }, context);
}

