import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase not configured (SUPABASE_URL / SERVICE_ROLE_KEY missing)");
  }

  _client = createClient(url, key);
  return _client;
}

export async function getMarketplaceSettings() {
  try {
    const { data, error } = await getSupabase()
      .from("marketplace_accounts")
      .select("*")
      .eq("enabled", true);

    if (error) {
      console.error("Error fetching marketplace settings:", error);
      return [];
    }

    const result = data || [];
    
    if (result.length === 0) {
      console.warn("[scheduler] No enabled marketplaces found in marketplace_accounts table");
    }

    return result;
  } catch (error: any) {
    if (error.message?.includes("Supabase not configured")) {
      console.warn("[scheduler] Supabase not configured, returning empty marketplace list");
      return [];
    }
    console.error("Error fetching marketplace settings:", error);
    return [];
  }
}

export async function saveListings(listings: any[]) {
  const { error } = await getSupabase().from("listings_raw").insert(listings);

  if (error) {
    console.error("Error saving listings:", error);
    throw error;
  }

  return { success: true };
}

export async function updateMarketplaceSync(marketplace: string) {
  try {
    const { error } = await getSupabase()
      .from("marketplace_accounts")
      .update({ last_sync: new Date().toISOString() })
      .eq("marketplace", marketplace);

    if (error) {
      console.error("Error updating marketplace sync:", error);
    }
  } catch (error: any) {
    if (error.message?.includes("Supabase not configured")) {
      // Non-fatal: Supabase is optional
      return;
    }
    console.error("Error updating marketplace sync:", error);
  }
}
