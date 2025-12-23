import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * STUB: Decoupled from @magnus-flipper-ai/tech-trade-core
 */
export async function GET() {
  return NextResponse.json({
    riskControl: {
      pricingHalted: false,
      haltReason: null
    },
    generatedAt: new Date().toISOString()
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Risk control management disabled",
      code: "SERVICE_DISABLED"
    },
    { status: 503 }
  );
}
