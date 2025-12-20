import { detectRegion, type Region } from "./region";

export type AppRegion = "US" | "UK";

export function normalizeAppRegion(value: unknown): AppRegion | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  if (upper === "US") return "US";
  if (upper === "UK") return "UK";
  // Accept country codes commonly found in geo headers / billing fields.
  if (upper === "GB") return "UK";
  return null;
}

export function appRegionFromDetected(region: Region | null | undefined): AppRegion {
  return region === "UK" ? "UK" : "US";
}

function regionFromCountryHeader(value: unknown): AppRegion | null {
  return normalizeAppRegion(value);
}

export function detectAppRegion(input?: Parameters<typeof detectRegion>[0]): AppRegion {
  try {
    return appRegionFromDetected(detectRegion(input));
  } catch {
    return "US";
  }
}

export function inferAppRegionFromRequest(req: Request, opts?: { user?: any }): AppRegion {
  // 1) Explicit override (?region=UK)
  try {
    const { searchParams } = new URL(req.url);
    const explicit = normalizeAppRegion(searchParams.get("region"));
    if (explicit) return explicit;
  } catch {
    // ignore
  }

  // 2) User profile / metadata (best-effort).
  const user = opts?.user;
  const meta = user?.user_metadata ?? user?.app_metadata ?? {};
  const userRegion =
    normalizeAppRegion(meta?.region) ??
    normalizeAppRegion(meta?.country) ??
    normalizeAppRegion(meta?.billing_country) ??
    normalizeAppRegion(meta?.billingCountry) ??
    null;
  if (userRegion) return userRegion;

  // 3) Geo headers (CDN-provided; no external IP services).
  const headerCountry =
    req.headers.get("x-vercel-ip-country") ??
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-country-code") ??
    req.headers.get("x-geo-country") ??
    req.headers.get("x-forwarded-country") ??
    null;

  const headerRegion = regionFromCountryHeader(headerCountry);
  if (headerRegion) return headerRegion;

  // 4) Accept-Language / timezone heuristic fallback.
  try {
    return appRegionFromDetected(detectRegion({ url: req.url, headers: req.headers }));
  } catch {
    return "US";
  }
}

