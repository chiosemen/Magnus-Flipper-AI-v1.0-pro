/**
 * Supabase service client (service role)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    return null;
  }
  supabaseClient = createClient(
    config.supabaseUrl,
    config.supabaseServiceKey
  );
  return supabaseClient;
}
