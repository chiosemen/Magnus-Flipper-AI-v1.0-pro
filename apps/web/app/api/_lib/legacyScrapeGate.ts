import { NextResponse } from "next/server";

/**
 * Hard gate for deprecated scrape-trigger routes.
 *
 * Guardrail: UI/web routes must never enqueue scraping jobs outside the pooled scheduler.
 * These endpoints remain available ONLY for local development debugging with an explicit admin flag.
 */
export function blockUnlessDevAdmin(req?: Request) {
  const isDev = process.env.NODE_ENV === "development";
  const adminEnabled =
    process.env.ADMIN_SCRAPE_ENABLED === "true" || process.env.ADMIN === "true";

  if (!(isDev && adminEnabled)) {
    return NextResponse.json(
      {
        error: "LEGACY_SCRAPE_DISABLED",
        message:
          "This endpoint is deprecated and disabled. Scraping is only triggered by the pooled scheduler.",
      },
      { status: 403 }
    );
  }

  // Dev-only auth gate: require an explicit admin key to prevent unauthenticated job enqueues.
  // Set `ADMIN_API_KEY` locally and pass it as `x-admin-key` header.
  const requiredKey = process.env.ADMIN_API_KEY;
  if (!requiredKey) {
    return NextResponse.json(
      {
        error: "ADMIN_KEY_REQUIRED",
        message:
          "Dev-only endpoint requires ADMIN_API_KEY to be set (and sent as x-admin-key).",
      },
      { status: 403 }
    );
  }

  const provided =
    req?.headers.get("x-admin-key")?.trim() ??
    req?.headers.get("x-admin-api-key")?.trim() ??
    "";
  if (!provided || provided !== requiredKey) {
    return NextResponse.json(
      {
        error: "ADMIN_KEY_REQUIRED",
        message: "Missing/invalid x-admin-key header for dev-only endpoint.",
      },
      { status: 403 }
    );
  }

  return null;
}
