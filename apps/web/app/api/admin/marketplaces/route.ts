import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { getMarketplaceSettings } from "@/lib/admin/marketplaces";
import { instrumentApiRoute } from "@/lib/observability/api-wrapper";

async function handler(request: NextRequest, context: { traceId: string }) {
  await requireAdmin();

  const marketplaces = await getMarketplaceSettings();

  // PERFORMANCE: Medium cache for marketplace settings - 120s cache, 180s stale-while-revalidate
  return NextResponse.json(marketplaces, {
    headers: {
      "Cache-Control": "s-maxage=120, stale-while-revalidate=180",
    },
  });
}

export const GET = instrumentApiRoute(handler, { module: "api/admin/marketplaces" });
