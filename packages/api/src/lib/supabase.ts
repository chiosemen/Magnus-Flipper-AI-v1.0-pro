import { createClient } from "@supabase/supabase-js";
import { config } from "./config.ts";
import { logger } from "./logger.ts";

const supabaseUrl = config.SUPABASE_URL;
const supabaseServiceKey = config.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseServiceKey) {
  logger.warn(
    "Supabase credentials not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE in .env"
  );
}

/**
 * Admin client with service role key (bypasses RLS)
 * Configured with connection pooling for production
 */
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "public",
      },
      global: {
        headers: {
          "x-application-name": "magnus-flipper-api",
        },
      },
    })
  : null;

/**
 * For user-scoped operations (respects RLS)
 * Creates a new client with user's access token
 */
export const createUserClient = (accessToken: string) => {
  if (!supabaseUrl || !config.SUPABASE_ANON_KEY) {
    throw new Error("Supabase not configured");
  }
  return createClient(supabaseUrl, config.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
