/**
 * Proxy HTTP Client Wrapper
 * Provides a single HTTP client interface that routes requests through proxies when enabled,
 * with automatic fallback to direct fetch if proxies are disabled or fail.
 */

import { loadProxyProviderConfig, loadMarketplaceProxyProfiles } from "./proxy-config.js";
import { createWorkerLogger } from "./worker-logger.js";

const logger = createWorkerLogger("proxy-layer");

interface ProxyRequestOptions extends RequestInit {
  marketplaceId: string;        // "facebook" | "vinted" | "gumtree" | etc.
  url: string;
}

/**
 * Fetch with proxy support
 * 
 * If proxies are enabled for the marketplace, routes the request through the proxy.
 * Otherwise, or on proxy failure, falls back to direct fetch.
 * 
 * @param opts - Request options including marketplaceId and url
 * @returns Response object
 */
export async function proxyFetch<T = unknown>(
  opts: ProxyRequestOptions
): Promise<Response> {
  const provider = loadProxyProviderConfig();
  const profiles = loadMarketplaceProxyProfiles();
  const profile = profiles.find(p => p.marketplaceId === opts.marketplaceId);

  // If proxies disabled or marketplace not enabled, fall back to direct fetch
  if (!provider.enabled || !profile?.enabled || !provider.baseUrl) {
    logger.info("proxy_disabled_or_unavailable", {
      marketplaceId: opts.marketplaceId,
      reason: !provider.enabled
        ? "provider_disabled"
        : !profile?.enabled
        ? "marketplace_profile_disabled"
        : "no_base_url",
    });

    return fetch(opts.url, opts);
  }

  // Construct proxy URL (depends on provider; this is generic pattern)
  // Most proxy providers support a pattern like: baseUrl?url=ENCODED_TARGET&country=REGION
  const targetUrl = encodeURIComponent(opts.url);
  const region = profile.defaultRegion ?? provider.globalRegion ?? "GB";
  const proxyUrl = `${provider.baseUrl}?url=${targetUrl}&country=${region}`;

  const headers = new Headers(opts.headers ?? {});
  
  // Add auth headers based on provider config
  if (provider.authToken) {
    headers.set("Authorization", `Bearer ${provider.authToken}`);
  }

  if (provider.username && provider.password) {
    const basic = Buffer.from(`${provider.username}:${provider.password}`).toString("base64");
    headers.set("Proxy-Authorization", `Basic ${basic}`);
  }

  const start = Date.now();

  try {
    const res = await fetch(proxyUrl, {
      ...opts,
      headers,
    });

    logger.info("proxy_request_completed", {
      marketplaceId: opts.marketplaceId,
      status: res.status,
      elapsedMs: Date.now() - start,
    });

    return res;
  } catch (err: any) {
    const error = err instanceof Error ? err : new Error(err?.message || "Unknown proxy error");
    logger.error("proxy_request_failed", error, {
      marketplaceId: opts.marketplaceId,
      elapsedMs: Date.now() - start,
    });

    // Fallback to direct fetch so workers don't hard fail
    logger.info("proxy_fallback_to_direct", {
      marketplaceId: opts.marketplaceId,
    });

    return fetch(opts.url, opts);
  }
}

