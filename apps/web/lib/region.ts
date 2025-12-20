export type Region = "UK" | "US" | "ROW";

// Lightweight region detection for pricing display.
// No IP lookups, no external APIs, no persistence; safe for SSR + CSR.
type DetectRegionInput =
  | string
  | URL
  | URLSearchParams
  | {
      region?: unknown;
      searchParams?: unknown;
      query?: unknown;
      search?: unknown;
      url?: unknown;
      timezone?: unknown;
      acceptLanguage?: unknown;
      headers?: unknown;
      languages?: unknown;
    }
  | undefined;

function normalizeRegion(value: unknown): Region | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  if (upper === "UK" || upper === "US" || upper === "ROW") return upper as Region;
  return null;
}

function getQueryParamRegion(value: unknown): Region | null {
  if (!value) return null;

  try {
    if (typeof value === "object") {
      const maybeGet = (value as any)?.get;
      if (typeof maybeGet === "function") {
        return normalizeRegion(maybeGet.call(value, "region"));
      }

      const regionValue = (value as any)?.region;
      if (Array.isArray(regionValue)) {
        return normalizeRegion(regionValue[0]);
      }
      const normalized = normalizeRegion(regionValue);
      if (normalized) return normalized;
    }

    if (value instanceof URLSearchParams) {
      return normalizeRegion(value.get("region"));
    }

    if (value instanceof URL) {
      return normalizeRegion(value.searchParams.get("region"));
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const direct = normalizeRegion(trimmed);
      if (direct) return direct;

      const looksLikeUrl = trimmed.includes("://");
      if (looksLikeUrl) {
        return normalizeRegion(new URL(trimmed).searchParams.get("region"));
      }

      if (trimmed.startsWith("?") || trimmed.includes("region=") || trimmed.includes("&")) {
        const params = new URLSearchParams(trimmed.startsWith("?") ? trimmed.slice(1) : trimmed);
        return normalizeRegion(params.get("region"));
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getBrowserQueryRegion(): Region | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeRegion(new URLSearchParams(window.location.search).get("region"));
  } catch {
    return null;
  }
}

function getTimezone(input: DetectRegionInput): string | null {
  if (input && typeof input === "object" && !(input instanceof URL) && !(input instanceof URLSearchParams)) {
    if (typeof (input as any).timezone === "string") return (input as any).timezone;
  }

  // Only infer timezone in the browser (server timezone != user timezone).
  if (typeof window === "undefined") return null;

  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

function regionFromTimezone(timezone: string | null): Region | null {
  if (!timezone) return null;
  if (timezone === "Europe/London") return "UK";
  if (timezone.startsWith("America/")) return "US";
  return null;
}

function getAcceptLanguage(input: DetectRegionInput): string | null {
  if (input && typeof input === "object") {
    const maybeGet = (input as any)?.get;
    if (typeof maybeGet === "function") {
      const value = maybeGet.call(input, "accept-language");
      if (typeof value === "string" && value.trim()) return value;
    }
  }

  if (input && typeof input === "object" && !(input instanceof URL) && !(input instanceof URLSearchParams)) {
    const acceptLanguage = (input as any).acceptLanguage;
    if (typeof acceptLanguage === "string" && acceptLanguage.trim()) return acceptLanguage;

    const headers = (input as any).headers;
    if (headers && typeof headers === "object") {
      const maybeGet = (headers as any)?.get;
      if (typeof maybeGet === "function") {
        const value = maybeGet.call(headers, "accept-language");
        if (typeof value === "string" && value.trim()) return value;
      }

      const direct = (headers as any)["accept-language"];
      if (typeof direct === "string" && direct.trim()) return direct;
    }

    const languages = (input as any).languages;
    if (Array.isArray(languages) && languages.length > 0) {
      return languages.filter((lang) => typeof lang === "string").join(",");
    }
  }

  if (typeof navigator === "undefined") return null;

  const langs = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages.join(",")
    : typeof navigator.language === "string"
    ? navigator.language
    : null;

  return typeof langs === "string" && langs.trim() ? langs : null;
}

function regionFromAcceptLanguage(acceptLanguage: string | null): Region | null {
  if (!acceptLanguage) return null;
  const parts = acceptLanguage
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean) as string[];

  for (const code of parts) {
    if (code.startsWith("en-gb")) return "UK";
    if (code.startsWith("en-us")) return "US";
  }

  return null;
}

export function detectRegion(input?: DetectRegionInput): Region {
  // 1) Explicit override (?region=UK)
  const explicit =
    (input && typeof input === "object" && !(input instanceof URL) && !(input instanceof URLSearchParams)
      ? normalizeRegion((input as any).region) ||
        getQueryParamRegion((input as any).searchParams) ||
        getQueryParamRegion((input as any).query) ||
        getQueryParamRegion((input as any).search) ||
        getQueryParamRegion((input as any).url)
      : null) ||
    getQueryParamRegion(input) ||
    getBrowserQueryRegion();

  if (explicit) return explicit;

  // 2) Browser timezone
  const tzRegion = regionFromTimezone(getTimezone(input));
  if (tzRegion) return tzRegion;

  // 3) Accept-Language (SSR header or browser languages)
  const langRegion = regionFromAcceptLanguage(getAcceptLanguage(input));
  if (langRegion) return langRegion;

  return "ROW";
}
