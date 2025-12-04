import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchAllJobs } from "@/lib/admin/jobs";
import { instrumentApiRoute } from "@/lib/observability/api-wrapper";

async function handler(request: NextRequest, context: { traceId: string }) {
  await requireAdmin();

  const stats = await fetchAllJobs();

  // PERFORMANCE: Cache headers - 60s cache, stale-while-revalidate for 120s
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
    },
  });
}

export const GET = instrumentApiRoute(handler, { module: "api/admin/jobs" });
