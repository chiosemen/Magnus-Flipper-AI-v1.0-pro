import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getMarketplaceSettings() {
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
  const { error } = await supabase.from("listings_raw").insert(listings);

  if (error) {
    console.error("Error saving listings:", error);
    throw error;
  }

  return { success: true };
}

export async function updateMarketplaceSync(marketplace: string) {
  const { error } = await supabase
    .from("marketplace_settings")
    .update({ last_sync: new Date().toISOString() })
    .eq("marketplace", marketplace);

  if (error) {
    console.error("Error updating marketplace sync:", error);
  }
}
