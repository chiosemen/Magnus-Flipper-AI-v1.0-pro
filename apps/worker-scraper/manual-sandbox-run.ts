/**
 * SANDBOX EXECUTION - Single Scrape Cycle
 *
 * This script runs exactly ONE scrape cycle with minimal scope to verify runtime health.
 * Hard constraints:
 * - 1 marketplace
 * - 1 query
 * - Max 5 items
 * - Concurrency = 1
 * - Stops after first successful scrape
 */

import { ScraperOrchestrator } from "@magnus-flipper-ai/scraper-sync";
import { ScraperConfig } from "@magnus-flipper-ai/scraper-sync";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from root directory
config({ path: resolve(process.cwd(), "../../.env") });

// Verify environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing required environment variables:");
  console.error("   SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✓" : "✗");
  process.exit(1);
}

async function runSandboxScrape() {
  console.log("\n🔬 PHASE 3 TEST: FACEBOOK (NOISE FILTERING)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Mode: Dual-source execution (Apify + DIY)");
  console.log("Marketplace: Facebook Marketplace");
  console.log("Query: laptop");
  console.log("Expected: Fewer items, no UI noise ('Find friends' filtered)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // SANDBOX CONFIG - Minimal, safe execution
  const sandboxConfig: ScraperConfig = {
    marketplace: "facebook",
    enabled: true,
    search_queries: ["laptop"], // Single query only
    location: "san francisco, ca",
    max_price: undefined,
    min_price: undefined,
    categories: [],
    max_pages: 1, // CRITICAL: Only 1 page
    delay_min_ms: 2000,
    delay_max_ms: 3000,
    use_proxy: false,
    headless: true,
  };

  const startTime = Date.now();
  let result;
  let errors: string[] = [];
  let fixesApplied: string[] = [];

  try {
    // Initialize orchestrator
    console.log("⚙️  Initializing ScraperOrchestrator...");
    const orchestrator = new ScraperOrchestrator(supabaseUrl!, supabaseKey!);

    // Execute single scrape
    console.log("🚀 Starting dual-source scrape...\n");
    console.log(`📍 Target: Facebook Marketplace (San Francisco)`);
    console.log(`🎯 Testing: DIY with noise filtering (no 'Find friends')\n`);

    result = await orchestrator.runScraper("facebook", sandboxConfig);

    // Execution completed
    const duration = Date.now() - startTime;

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📊 EXECUTION RESULT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Status: ${result.success ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`Marketplace: ${result.marketplace}`);
    console.log(`Query: ${sandboxConfig.search_queries[0]}`);
    console.log(`Items scraped: ${result.total_scraped}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Errors: ${result.errors.length > 0 ? result.errors.join(", ") : "none"}`);
    console.log(`Fixes applied: ${fixesApplied.length > 0 ? fixesApplied.join(", ") : "none"}`);
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎯 VERDICT");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (result.success && result.total_scraped > 0) {
      console.log("✅ Safe to run workers today: YES");
      console.log("   Runtime health verified, scraper operational");
    } else if (result.success && result.total_scraped === 0) {
      console.log("⚠️  Safe to run workers today: MAYBE");
      console.log("   Scraper runs but found no items - verify marketplace availability");
    } else {
      console.log("❌ Safe to run workers today: NO");
      console.log("   Critical errors detected, investigation required");
    }
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    // Log sample listing if available
    if (result.listings.length > 0) {
      console.log("📦 Sample listing:");
      const sample = result.listings[0];
      console.log(`   Title: ${sample.title}`);
      console.log(`   Price: ${sample.currency} ${sample.price}`);
      console.log(`   Link: ${sample.link}`);
      console.log(`   Location: ${sample.location || "N/A"}\n`);
    }

    process.exit(result.success ? 0 : 1);
  } catch (error: any) {
    console.error("\n❌ CRITICAL ERROR");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error("\n⚠️  Safe to run workers today: NO");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    process.exit(1);
  }
}

// Execute
runSandboxScrape();
