import { Actor } from "apify";
import { AutoscaledPool, gotScraping, log } from "crawlee";
import cheerio from "cheerio";
import PQueue from "p-queue";

const FACEBOOK_DEFAULT_MAX_ITEMS = 50;
const VINTED_DEFAULT_MAX_ITEMS = 50;
const MAX_POOL_CONCURRENCY = 20;

const VINTED_DOMAINS = {
  GB: "www.vinted.co.uk",
  UK: "www.vinted.co.uk",
  US: "www.vinted.com",
  FR: "www.vinted.fr",
  DE: "www.vinted.de",
  ES: "www.vinted.es",
  IT: "www.vinted.it",
  NL: "www.vinted.nl",
};

const PRICE_REGEX = /([$£€])\s*([\d,.]+)/;

function normalizeQueries(rawQueries) {
  if (!Array.isArray(rawQueries)) return [];
  return rawQueries
    .map((q) => ({
      query: typeof q?.query === "string" ? q.query.trim() : "",
      location: typeof q?.location === "string" ? q.location.trim() : undefined,
      country: typeof q?.country === "string" ? q.country.trim() : undefined,
      maxItems:
        typeof q?.maxItems === "number" && q.maxItems > 0 ? q.maxItems : undefined,
    }))
    .filter((q) => q.query.length > 0);
}

async function scrapeFacebook({ query, location, maxItems }) {
  const limit = maxItems ?? FACEBOOK_DEFAULT_MAX_ITEMS;
  const url = new URL("https://m.facebook.com/marketplace/search/");
  url.searchParams.set("query", query);
  if (location) {
    url.searchParams.set("location", location);
  }

  const { body } = await gotScraping({
    url: url.toString(),
    headers: {
      "User-Agent": Actor.getUserAgent(),
    },
  });

  const $ = cheerio.load(body);
  const seen = new Set();
  const results = [];

  $("a").each((_, element) => {
    if (results.length >= limit) return;
    const href = $(element).attr("href");
    if (!href || !href.includes("/marketplace/item/")) return;

    const absoluteUrl = href.startsWith("http")
      ? href
      : `https://m.facebook.com${href}`;

    if (seen.has(absoluteUrl)) return;
    seen.add(absoluteUrl);

    const title =
      $(element).find("img").attr("alt") ||
      $(element).text().split("\n")[0] ||
      "Listing";

    const text = $(element).text();
    const priceMatch = text.match(PRICE_REGEX);

    results.push({
      marketplace: "facebook",
      query,
      title: title.trim(),
      price: priceMatch ? `${priceMatch[1]}${priceMatch[2]}` : "—",
      location: location || undefined,
      url: absoluteUrl,
      image: $(element).find("img").attr("src") || "",
    });
  });

  return results;
}

async function scrapeVinted({ query, country, maxItems }) {
  const limit = maxItems ?? VINTED_DEFAULT_MAX_ITEMS;
  const domain =
    (country && VINTED_DOMAINS[country.toUpperCase()]) || VINTED_DOMAINS.GB;
  const url = new URL(`https://${domain}/api/v2/catalog/items`);
  url.searchParams.set("search_text", query);
  url.searchParams.set("per_page", String(Math.min(limit, 96)));
  url.searchParams.set("page", "1");

  const { body } = await gotScraping({
    url: url.toString(),
    headers: {
      "User-Agent": Actor.getUserAgent(),
      Accept: "application/json",
    },
  });

  const data = JSON.parse(body);
  const items = Array.isArray(data?.items) ? data.items : [];

  return items.slice(0, limit).map((item) => ({
    marketplace: "vinted",
    query,
    title: item.title || "Listing",
    price: item.price || item.price_numeric || "—",
    size: item.size_title || undefined,
    brand: item.brand_title || undefined,
    url: item.url || (item.path ? `https://${domain}${item.path}` : ""),
    image: item.photo?.url || item.photo?.high_resolution?.url || "",
  }));
}

async function main() {
  await Actor.init();
  const input = (await Actor.getInput()) ?? {};

  const facebookQueries = normalizeQueries(input.facebookQueries);
  const vintedQueries = normalizeQueries(input.vintedQueries);
  const maxConcurrencyPerMarketplace =
    typeof input.maxConcurrencyPerMarketplace === "number" &&
    input.maxConcurrencyPerMarketplace > 0
      ? Math.min(input.maxConcurrencyPerMarketplace, 10)
      : 10;

  const facebookQueue = new PQueue({ concurrency: maxConcurrencyPerMarketplace });
  const vintedQueue = new PQueue({ concurrency: maxConcurrencyPerMarketplace });

  const tasks = [
    ...facebookQueries.map((q) => ({ marketplace: "facebook", ...q })),
    ...vintedQueries.map((q) => ({ marketplace: "vinted", ...q })),
  ];

  if (tasks.length === 0) {
    log.warning("No queries provided. Exiting.");
    await Actor.exit();
    return;
  }

  let taskIndex = 0;

  const pool = new AutoscaledPool({
    maxConcurrency: MAX_POOL_CONCURRENCY,
    minConcurrency: 1,
    runTaskFunction: async () => {
      const task = tasks[taskIndex++];
      if (!task) return;

      if (task.marketplace === "facebook") {
        await facebookQueue.add(async () => {
          const items = await scrapeFacebook(task);
          if (items.length > 0) {
            await Actor.pushData(items);
          }
        });
      } else {
        await vintedQueue.add(async () => {
          const items = await scrapeVinted(task);
          if (items.length > 0) {
            await Actor.pushData(items);
          }
        });
      }
    },
    isTaskReadyFunction: async () => taskIndex < tasks.length,
    isFinishedFunction: async () =>
      taskIndex >= tasks.length &&
      facebookQueue.pending === 0 &&
      facebookQueue.size === 0 &&
      vintedQueue.pending === 0 &&
      vintedQueue.size === 0,
  });

  log.info("Starting marketplace scrape", {
    facebookQueries: facebookQueries.length,
    vintedQueries: vintedQueries.length,
    maxConcurrencyPerMarketplace,
  });

  await pool.run();
  await Promise.all([facebookQueue.onIdle(), vintedQueue.onIdle()]);

  log.info("Marketplace scrape finished");
  await Actor.exit();
}

await main();
