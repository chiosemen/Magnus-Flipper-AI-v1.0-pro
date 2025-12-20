import { NextResponse } from "next/server";

/**
 * Hard gate for deprecated scrape-trigger routes.
 *
 * Guardrail: UI/web routes must never enqueue scraping jobs outside the pooled scheduler.
 * These endpoints remain available ONLY for local development debugging with an explicit admin flag.
 */
export function blockUnlessDevAdmin() {
  const isDev = process.env.NODE_ENV === "development";
  const adminEnabled =
    process.env.ADMIN_SCRAPE_ENABLED === "true" || process.env.ADMIN === "true";

  if (isDev && adminEnabled) return null;

  return NextResponse.json(
    {
      error: "LEGACY_SCRAPE_DISABLED",
      message:
        "This endpoint is deprecated and disabled. Scraping is only triggered by the pooled scheduler.",
    },
    { status: 403 }
  );
}

