#!/usr/bin/env node
/**
 * Standalone script to run active search poller
 * 
 * Usage (db-full mode):
 *   INGESTION_ENABLED=true INGESTION_MODE=db-full SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node dist/scripts/pollActiveSearches.js
 * 
 * Usage (db-lite mode - no credentials needed):
 *   INGESTION_ENABLED=true INGESTION_MODE=db-lite node dist/scripts/pollActiveSearches.js
 * 
 * Or via pnpm:
 *   INGESTION_MODE=db-lite pnpm --filter @magnus-flipper-ai/scraper-sync poll:active-searches
 */

import { pollActiveSearches } from "../orchestrator/pollActiveSearches.js";
import { IS_DB_LITE } from "../config/ingestionMode.js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only require credentials in db-full mode
if (!IS_DB_LITE && (!supabaseUrl || !supabaseKey)) {
  console.error("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in db-full mode");
  console.error("Use INGESTION_MODE=db-lite to run without database credentials");
  process.exit(1);
}

console.log("[INGEST] Starting active search poller...");
console.log(`[INGEST] INGESTION_MODE: ${process.env.INGESTION_MODE || "db-full"}`);
console.log(`[INGEST] INGESTION_ENABLED: ${process.env.INGESTION_ENABLED || "false"}`);

pollActiveSearches(supabaseUrl, supabaseKey)
  .then(() => {
    console.log("[INGEST] Poller completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("[INGEST] Poller failed:", error);
    process.exit(1);
  });
