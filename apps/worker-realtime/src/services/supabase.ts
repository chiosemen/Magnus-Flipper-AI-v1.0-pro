import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

export async function getMarketplaceSettings() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("Supabase not configured for marketplace settings");
    return [];
  }

  const { data, error } = await supabase
    .from("marketplace_settings")
    .select("*")
    .eq("enabled", true);

  if (error) {
    console.error("Error fetching marketplace settings:", error);
    return [];
  }

  return data || [];
}

export async function saveListings(listings: any[]) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase not configured for saving listings");
  }

  const { error } = await supabase.from("listings_raw").insert(listings);

  if (error) {
    console.error("Error saving listings:", error);
    throw error;
  }

  return { success: true };
}

export async function updateMarketplaceSync(marketplace: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("Supabase not configured for marketplace sync");
    return;
  }

  const { error } = await supabase
    .from("marketplace_settings")
    .update({ last_sync: new Date().toISOString() })
    .eq("marketplace", marketplace);

  if (error) {
    console.error("Error updating marketplace sync:", error);
  }
}
