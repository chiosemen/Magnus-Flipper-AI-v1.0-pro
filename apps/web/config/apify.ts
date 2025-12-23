const apifyOnlyFlag =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_APIFY_ONLY_MODE
    : undefined;

export const APIFY_ONLY_MODE =
  apifyOnlyFlag === undefined ? true : apifyOnlyFlag !== "false";

export const APIFY_DEFAULT_ACTOR =
  process.env.APIFY_ACTOR_ID || "apify/web-scraper";

export const APIFY_MAX_ITEMS = Math.max(
  1,
  Math.min(Number(process.env.NEXT_PUBLIC_APIFY_MAX_ITEMS || 100), 200)
);

export const APIFY_POLL_INTERVAL_MS = 1500;
