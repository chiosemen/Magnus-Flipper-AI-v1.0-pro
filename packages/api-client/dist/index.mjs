// validators.ts
import { z } from "zod";
var SavedSearchSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  category: z.string(),
  manufacturer: z.string(),
  models: z.array(z.string()),
  minPrice: z.number(),
  maxPrice: z.number(),
  radiusMiles: z.number(),
  location: z.string(),
  active: z.boolean(),
  createdAt: z.string().datetime().optional()
});
var ListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  image: z.string(),
  source: z.enum(["facebook", "craigslist", "offerup", "gumtree", "ebay"]),
  location: z.string(),
  postedAt: z.string().datetime(),
  url: z.string().optional()
});
var AlertRecordSchema = z.object({
  id: z.string(),
  saved_search_id: z.string(),
  listing_id: z.string(),
  matchedAt: z.string().datetime()
});
var BillingStatusSchema = z.object({
  plan: z.enum(["STARTER", "BASIC", "PREMIUM", "ULTRA", "TRIAL"]).optional(),
  status: z.string().optional(),
  trial_expires_at: z.string().datetime().optional(),
  subscription_current_period_end: z.string().datetime().optional()
});
var AlertsStatsSchema = z.object({
  totalAlerts: z.number(),
  lastMatch: z.string().datetime().optional()
});
var SavedSearchArraySchema = z.array(SavedSearchSchema);
var ListingArraySchema = z.array(ListingSchema);
var AlertRecordArraySchema = z.array(AlertRecordSchema);

// alerts.ts
function createAlertsApi(fetcher) {
  return {
    recent: async (signal) => {
      const data = await fetcher("/api/alerts/recent", { signal });
      return AlertRecordArraySchema.parse(data);
    },
    stats: async (signal) => {
      const data = await fetcher("/api/alerts/stats", { signal });
      return AlertsStatsSchema.parse(data);
    }
  };
}

// fetchClient.ts
var RETRYABLE_STATUS = /* @__PURE__ */ new Set([429, 500, 502, 503, 504]);
var DEFAULT_BASE_URL = resolveDefaultBaseUrl();
var DEFAULT_RETRIES = 2;
var DEFAULT_RETRY_DELAY_MS = 300;
var DEFAULT_TIMEOUT_MS = 1e4;
var ApiError = class extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
};
function createFetchClient(config = {}) {
  const {
    baseUrl = DEFAULT_BASE_URL,
    getToken,
    defaultHeaders,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryOn
  } = config;
  const shouldRetry = async (response, error, attempt) => {
    const decision = typeof retryOn === "function" ? await retryOn(response, error, attempt) : defaultShouldRetry(response, error);
    return decision && attempt < retries;
  };
  return async function fetchWithRetry(path, init = {}) {
    let attempt = 0;
    let lastError;
    while (attempt <= retries) {
      const url = buildUrl(baseUrl, path);
      const headers = mergeHeaders(defaultHeaders, init.headers);
      const token = init.skipAuth ? null : await resolveToken(getToken);
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const body = normalizeBody(init.body);
      if (body != null && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      const { signal, cleanup } = combineSignals(init.signal, timeoutMs);
      try {
        const response = await fetch(url, { ...init, body, headers, signal });
        if (response.ok) {
          cleanup();
          return await parseResponse(response);
        }
        if (await shouldRetry(response, void 0, attempt)) {
          cleanup();
          await backoff(retryDelayMs, attempt);
          attempt += 1;
          continue;
        }
        cleanup();
        throw await buildApiError(response);
      } catch (error) {
        cleanup();
        if (isAbortError(error) && init.signal?.aborted) {
          throw error;
        }
        if (await shouldRetry(void 0, error, attempt)) {
          await backoff(retryDelayMs, attempt);
          attempt += 1;
          lastError = error;
          continue;
        }
        throw toError(error);
      }
    }
    throw toError(lastError ?? "Request failed after retries");
  };
}
function resolveDefaultBaseUrl() {
  if (typeof process !== "undefined" && process?.env) {
    return process.env.MAGNUS_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "https://api.magnus-flipper.ai";
  }
  return "https://api.magnus-flipper.ai";
}
function buildUrl(baseUrl, path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
function mergeHeaders(...headersList) {
  const merged = new Headers();
  headersList.forEach((entry) => {
    if (!entry) return;
    new Headers(entry).forEach((value, key) => merged.set(key, value));
  });
  return merged;
}
function normalizeBody(body) {
  if (body == null) return body ?? void 0;
  if (typeof body === "string" || body instanceof Blob || body instanceof ArrayBuffer || body instanceof FormData || body instanceof URLSearchParams || typeof ReadableStream !== "undefined" && body instanceof ReadableStream) {
    return body;
  }
  return JSON.stringify(body);
}
function combineSignals(signal, timeoutMs) {
  if (!timeoutMs && !signal) {
    return { signal: void 0, cleanup: () => {
    } };
  }
  const controller = new AbortController();
  const signals = [];
  if (signal) signals.push(signal);
  const timeout = timeoutMs ? setTimeout(() => controller.abort(makeAbortError("Request timed out")), timeoutMs) : void 0;
  const onAbort = () => controller.abort(makeAbortError("Aborted"));
  signals.forEach((s) => {
    if (s.aborted) {
      controller.abort(makeAbortError("Aborted"));
    } else {
      s.addEventListener("abort", onAbort);
    }
  });
  return {
    signal: signals.length ? controller.signal : signal ?? controller.signal,
    cleanup: () => {
      if (timeout) clearTimeout(timeout);
      signals.forEach((s) => s.removeEventListener("abort", onAbort));
    }
  };
}
async function parseResponse(response) {
  if (response.status === 204) return void 0;
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!text) return void 0;
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError("Failed to parse JSON response", response.status, text);
    }
  }
  return text;
}
async function buildApiError(response) {
  let parsedBody;
  const contentType = response.headers.get("content-type") || "";
  try {
    parsedBody = contentType.includes("application/json") ? await response.json() : await response.text();
  } catch {
    parsedBody = void 0;
  }
  return new ApiError(
    `Request failed with status ${response.status}${response.statusText ? ` (${response.statusText})` : ""}`,
    response.status,
    parsedBody
  );
}
function defaultShouldRetry(response, error) {
  if (response) return RETRYABLE_STATUS.has(response.status);
  if (!error) return false;
  if (error instanceof ApiError) return false;
  if (error instanceof Error) return error.name === "TypeError" || error.name === "FetchError" || error.name === "AbortError";
  return false;
}
async function backoff(baseDelayMs, attempt) {
  const delayMs = Math.min(baseDelayMs * 2 ** attempt, 5e3);
  const jitter = Math.random() * 100;
  return new Promise((resolve) => setTimeout(resolve, delayMs + jitter));
}
async function resolveToken(getToken) {
  if (!getToken) return null;
  return getToken();
}
function isAbortError(error) {
  if (!error) return false;
  return error instanceof DOMException ? error.name === "AbortError" : error instanceof Error && error.name === "AbortError";
}
function toError(value) {
  if (value instanceof Error) return value;
  return new Error(typeof value === "string" ? value : "Unknown error");
}
function makeAbortError(message) {
  if (typeof DOMException !== "undefined") {
    return new DOMException(message, "AbortError");
  }
  const err = new Error(message);
  err.name = "AbortError";
  return err;
}

// listings.ts
function createListingsApi(fetcher) {
  return {
    feed: async (params = {}, signal) => {
      const query = new URLSearchParams();
      if (params.page != null) query.set("page", String(params.page));
      if (params.limit != null) query.set("limit", String(params.limit));
      const path = query.toString() ? `/api/listings/feed?${query.toString()}` : "/api/listings/feed";
      const data = await fetcher(path, { signal });
      return ListingArraySchema.parse(data);
    },
    getById: async (id, signal) => {
      const data = await fetcher(`/api/listings/${encodeURIComponent(id)}`, { signal });
      return ListingSchema.parse(data);
    }
  };
}

// savedSearches.ts
function createSavedSearchesApi(fetcher) {
  return {
    list: async (signal) => {
      const data = await fetcher("/api/saved-searches", { signal });
      return SavedSearchArraySchema.parse(data);
    },
    create: async (payload, signal) => {
      const data = await fetcher("/api/saved-searches", {
        method: "POST",
        body: JSON.stringify(payload),
        signal
      });
      return SavedSearchSchema.parse(data);
    },
    getById: async (id, signal) => {
      const data = await fetcher(`/api/saved-searches/${encodeURIComponent(id)}`, { signal });
      return SavedSearchSchema.parse(data);
    },
    update: async (id, payload, signal) => {
      const data = await fetcher(`/api/saved-searches/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
        signal
      });
      return SavedSearchSchema.parse(data);
    },
    remove: async (id, signal) => {
      await fetcher(`/api/saved-searches/${encodeURIComponent(id)}`, {
        method: "DELETE",
        signal
      });
    }
  };
}

// index.ts
function createApiClient(config = {}) {
  const fetcher = createFetchClient(config);
  const savedSearches = createSavedSearchesApi(fetcher);
  const listings = createListingsApi(fetcher);
  const alerts = createAlertsApi(fetcher);
  const billing = {
    status: async (signal) => {
      const data = await fetcher("/api/billing/status", { signal });
      return BillingStatusSchema.parse(data);
    }
  };
  const health = async (signal) => fetcher("/health", { signal });
  return {
    fetch: fetcher,
    savedSearches,
    listings,
    alerts,
    billing,
    health
  };
}
var apiClient = createApiClient();
export {
  AlertRecordArraySchema,
  AlertRecordSchema,
  AlertsStatsSchema,
  ApiError,
  BillingStatusSchema,
  ListingArraySchema,
  ListingSchema,
  SavedSearchArraySchema,
  SavedSearchSchema,
  apiClient,
  createAlertsApi,
  createApiClient,
  createFetchClient,
  createListingsApi,
  createSavedSearchesApi
};
//# sourceMappingURL=index.mjs.map