/**
 * Manual runner to execute the scraper without Azure Functions.
 * Useful for local/one-off runs against Supabase using the service role key.
 */

import { ScraperOrchestrator } from "@magnus-flipper-ai/scraper-sync";
import { supabase, supabaseServiceRoleKey, supabaseUrl } from "./supabase.js";

async function fetchEnabledScraperConfigs() {
  const { data, error } = await supabase
    .from("marketplace_settings")
    .select("marketplace, enabled, config")
    .eq("enabled", true);

  if (error) {
    throw error;
  }

  return data || [];
}

function aggregateConfigs(configs: any[]) {
  const configsByMarketplace = new Map<string, any[]>();

  for (const config of configs) {
    const marketplace = config.marketplace;
    if (!configsByMarketplace.has(marketplace)) {
      configsByMarketplace.set(marketplace, []);
    }
    configsByMarketplace.get(marketplace)!.push(config);
  }

  return Array.from(configsByMarketplace.entries()).map(
    ([marketplace, marketplaceConfigs]) => {
      const allQueries = new Set<string>();
      for (const cfg of marketplaceConfigs) {
        const cfgData = cfg.config || {};
        for (const query of cfgData.search_queries || []) {
          allQueries.add(query);
        }
      }

      return {
        marketplace,
        config: {
          marketplace,
          enabled: true,
          search_queries: Array.from(allQueries),
          location: marketplaceConfigs[0]?.config?.location || undefined,
          max_price: Math.max(
            ...marketplaceConfigs.map((c) => c.config?.max_price || 0)
          ),
          min_price: Math.min(
            ...marketplaceConfigs.map(
              (c) => c.config?.min_price ?? Number.POSITIVE_INFINITY
            )
          ),
          categories: [],
          max_pages: Math.max(
            ...marketplaceConfigs.map((c) => c.config?.max_pages || 3)
          ),
          delay_min_ms: 2000,
          delay_max_ms: 5000,
          use_proxy: marketplaceConfigs.some((c) => c.config?.use_proxy),
          headless: true,
        },
      };
    }
  );
}

async function main() {
  console.log("🔥 Manual scraper run starting");

  const startTime = Date.now();
  const orchestrator = new ScraperOrchestrator(
    supabaseUrl,
    supabaseServiceRoleKey
  );

  const configs = await fetchEnabledScraperConfigs();
  if (!configs.length) {
    console.warn("No enabled scraper configs found");
    return;
  }

  const aggregatedConfigs = aggregateConfigs(configs);
  const results = [];

  for (const { marketplace, config } of aggregatedConfigs) {
    console.log(`➡️ Scraping ${marketplace}`);
    try {
      const result = await orchestrator.runScraper(marketplace, config);
      results.push(result);
      console.log(
        `${marketplace} scraper completed: ${result.total_scraped} items`
      );
    } catch (error: any) {
      console.error(`Error running ${marketplace} scraper:`, error);
    }
  }

  const totalScraped = results.reduce((sum, r) => sum + r.total_scraped, 0);
  const successful = results.filter((r) => r.success).length;

  await supabase.from("worker_logs").insert({
    worker_name: "marketplace_scraper_manual",
    executed_at: new Date(startTime).toISOString(),
    duration_ms: Date.now() - startTime,
    marketplaces_scraped: results.length,
    total_items_scraped: totalScraped,
    successful_scrapers: successful,
    results,
  });

  console.log("✅ Manual scraper run finished");
}

main().catch((err) => {
  console.error("❌ Scraper crashed", err);
  process.exit(1);
});
