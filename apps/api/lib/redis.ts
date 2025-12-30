import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function nowSec() {
  return Math.floor(Date.now() / 1000);
}

// Stable-ish query normalization for cache keys
export function normalizeQuery(q: string) {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

export function searchKey(marketplace: string, country: string, qNorm: string) {
  return `search:${marketplace}:${country}:${qNorm}`;
}

export function ingestKey(marketplace: string, country: string, qNorm: string) {
  return `browser_ingest:${marketplace}:${country}:${qNorm}`;
}

export function lockKey(marketplace: string, country: string, qNorm: string) {
  return `lock:search:${marketplace}:${country}:${qNorm}`;
}

export function ttlFor(marketplace: string): number {
  if (marketplace === "gumtree") return 120;      // 2 min
  if (marketplace === "vinted") return 300;        // 5 min
  if (marketplace === "facebook") return 300;      // 5 min
  return 300;                                      // default 5 min
}

