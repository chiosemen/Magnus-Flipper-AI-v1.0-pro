import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { toggleMarketplace } from "@/lib/admin/marketplaces";
import { instrumentApiRoute } from "@/lib/observability/api-wrapper";

async function handler(request: NextRequest, context: { traceId: string }) {
  await requireAdmin();

  const { marketplace, enabled } = await request.json();

  if (!marketplace || typeof enabled !== "boolean") {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  await toggleMarketplace(marketplace, enabled);

  return NextResponse.json({ success: true });
}

export const POST = instrumentApiRoute(handler, { module: "api/admin/marketplaces/toggle" });
