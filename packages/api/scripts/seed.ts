import { supabaseAdmin } from "../src/lib/supabase.ts";
import { logger } from "../src/lib/logger.ts";

const marketplaces = ["eBay", "Amazon", "Facebook Marketplace", "Craigslist", "OfferUp"];
const categories = ["Electronics", "Fashion", "Home & Garden", "Sports", "Collectibles", "Toys"];

const sampleDeals = [
  { title: "MacBook Pro 14 M1 Pro", price: 1699, category: "Electronics", marketplace: "eBay", score: 94 },
  { title: "Nike Air Jordan 1 Retro High", price: 175, category: "Fashion", marketplace: "Facebook Marketplace", score: 92 },
  { title: "Sony WH-1000XM5 Headphones", price: 329, category: "Electronics", marketplace: "Amazon", score: 88 },
  { title: "Dyson V15 Detect Vacuum", price: 599, category: "Home & Garden", marketplace: "eBay", score: 91 },
  { title: "PlayStation 5 Console", price: 499, category: "Electronics", marketplace: "Craigslist", score: 95 },
  { title: "Peloton Bike+ with Screen", price: 1895, category: "Sports", marketplace: "OfferUp", score: 87 },
  { title: "LEGO Star Wars Millennium Falcon", price: 849, category: "Toys", marketplace: "Amazon", score: 82 },
  { title: "Vintage Rolex Submariner", price: 8500, category: "Collectibles", marketplace: "eBay", score: 96 },
  { title: "Herman Miller Aeron Chair", price: 895, category: "Home & Garden", marketplace: "Craigslist", score: 89 },
  { title: "Canon EOS R6 Mark II Camera", price: 2499, category: "Electronics", marketplace: "eBay", score: 93 },
];

/**
 * Generate random deals with realistic data
 */
function generateRandomDeals(count: number) {
  const deals = [];

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const marketplace = marketplaces[Math.floor(Math.random() * marketplaces.length)];
    const baseDeal = sampleDeals[Math.floor(Math.random() * sampleDeals.length)];

    deals.push({
      title: `${baseDeal.title} (Variant ${i + 1})`,
      price: Math.round(baseDeal.price * (0.8 + Math.random() * 0.4)), // ±20% price variation
      currency: "USD",
      score: Math.floor(70 + Math.random() * 30), // Score between 70-100
      url: `https://${marketplace.toLowerCase().replace(/\s/g, "")}.com/item/${Date.now()}-${i}`,
      marketplace,
      category,
      description: `Great deal on ${baseDeal.title}. Excellent condition, barely used.`,
      image_url: `https://placehold.co/400x300?text=${encodeURIComponent(baseDeal.title)}`,
    });
  }

  return deals;
}

/**
 * Seed database with sample data
 */
async function seedDatabase() {
  if (!supabaseAdmin) {
    logger.error("Supabase not configured. Cannot seed database.");
    process.exit(1);
  }

  logger.info("Starting database seed...");

  try {
    // Clear existing deals (optional)
    const shouldClear = process.argv.includes("--clear");
    if (shouldClear) {
      logger.info("Clearing existing deals...");
      const { error: deleteError } = await supabaseAdmin.from("deals").delete().neq("id", "");
      if (deleteError) {
        logger.warn({ error: deleteError }, "Failed to clear existing deals");
      } else {
        logger.info("Existing deals cleared");
      }
    }

    // Insert sample deals
    const count = parseInt(process.argv.find(arg => arg.startsWith("--count="))?.split("=")[1] || "100");
    logger.info(`Generating ${count} sample deals...`);

    const deals = generateRandomDeals(count);

    logger.info("Inserting deals into database...");
    const { data, error } = await supabaseAdmin.from("deals").insert(deals).select();

    if (error) {
      logger.error({ error }, "Failed to insert deals");
      process.exit(1);
    }

    logger.info(`✅ Successfully seeded ${data?.length || 0} deals`);

    // Display sample
    if (data && data.length > 0) {
      logger.info("Sample deals:");
      data.slice(0, 5).forEach(deal => {
        logger.info(`  - ${deal.title} ($${deal.price}) - Score: ${deal.score}`);
      });
    }

    // Summary statistics
    const { data: stats } = await supabaseAdmin
      .from("deals")
      .select("score, price, marketplace")
      .order("score", { ascending: false })
      .limit(1);

    if (stats && stats.length > 0) {
      logger.info("\nDatabase Summary:");
      logger.info(`  Total deals: ${count}`);
      logger.info(`  Top score: ${stats[0].score}`);
      logger.info(`  Marketplaces: ${marketplaces.length}`);
      logger.info(`  Categories: ${categories.length}`);
    }

    logger.info("\n🎉 Database seeding complete!");
    logger.info("\nUsage:");
    logger.info("  pnpm seed              - Seed 100 deals");
    logger.info("  pnpm seed --count=500  - Seed 500 deals");
    logger.info("  pnpm seed --clear      - Clear existing deals first");

  } catch (error) {
    logger.error({ error }, "Unexpected error during seeding");
    process.exit(1);
  }
}

// Run if called directly
seedDatabase();
