import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * STUB: Decoupled from @magnus-flipper-ai/tech-trade-core
 * Tech trade functionality disabled in web app
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Tech trade quote service unavailable",
      code: "SERVICE_DISABLED"
    },
    { status: 503 }
  );
}
