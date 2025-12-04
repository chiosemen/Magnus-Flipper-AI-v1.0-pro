import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchScanners } from "@/lib/admin/scanners";
import { instrumentApiRoute } from "@/lib/observability/api-wrapper";

async function handler(request: NextRequest, context: { traceId: string }) {
  await requireAdmin();

  const telemetry = await fetchScanners();

  // PERFORMANCE: Short cache for telemetry (changes frequently) - 30s cache, 60s stale-while-revalidate
  return NextResponse.json(telemetry, {
    headers: {
      "Cache-Control": "s-maxage=30, stale-while-revalidate=60",
    },
  });
}

export const GET = instrumentApiRoute(handler, { module: "api/admin/scanners" });
