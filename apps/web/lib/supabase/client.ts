import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export function supabaseBrowser() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
