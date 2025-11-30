import { createClient } from "redis";
import pLimit from "p-limit";
import { marketplaces } from "./adapters/index.js";

const redis = createClient({ url: process.env.REDIS_URL });
redis.on("error", (err) => console.error("Redis error:", err));
await redis.connect();

const QUERIES = (process.env.SCRAPER_QUERIES || "iphone,airpods,macbook")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const CONCURRENCY = Number(process.env.SCRAPER_CONCURRENCY || 3);
const INTERVAL_MS = Number(process.env.SCRAPER_INTERVAL_MS || 60000);

const limit = pLimit(CONCURRENCY);

async function withRetry(fn, { retries = 3, baseDelayMs = 500 } = {}) {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt > retries) {
        console.error("Maximum retries reached:", error);
        throw error;
      }
      const waitTime = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Retrying in ${waitTime}ms (attempt ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

async function runOneCycle() {
  if (QUERIES.length === 0) {
    console.warn("No queries provided; skipping cycle.");
    return;
  }

  console.log("Starting scrape cycle", new Date().toISOString());

  const jobs = [];

  for (const query of QUERIES) {
    for (const { name, adapter } of marketplaces) {
      jobs.push(
        limit(async () => {
          await withRetry(async () => {
            console.log(`Scraping ${name} for "${query}"`);

            const listings = await adapter({ query, limit: 10 });
            if (!listings.length) {
              console.log(`No listings found for ${name}:${query}`);
              return;
            }

            const payload = {
              marketplace: name,
              query,
              listings,
              createdAt: new Date().toISOString()
            };

            await redis.lPush("scraper:results", JSON.stringify(payload));
            await redis.lTrim("scraper:results", 0, 200);

            console.log(`Saved ${listings.length} listings from ${name}`);
          });
        })
      );
    }
  }

  await Promise.allSettled(jobs);
  console.log("Scrape cycle complete");
}

async function mainLoop() {
  while (true) {
    try {
      await runOneCycle();
    } catch (error) {
      console.error("Cycle error:", error);
    }
    console.log(`Sleeping for ${INTERVAL_MS}ms`);
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
}

mainLoop().catch((error) => {
  console.error("Fatal worker error:", error);
  process.exit(1);
});
