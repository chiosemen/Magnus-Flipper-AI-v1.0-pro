export function userConcurrencyKey(userId: string, kind: "instant" | "timed") {
  return `sem:user:${userId}:${kind}`;
}

export function globalFbScrapeKey() {
  return "sem:global:fb-scrape";
}

