import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * STUB: Decoupled from @magnus-flipper-ai/tech-trade-core
 */
export async function GET() {
  return NextResponse.json({
    movers: [],
    generatedAt: new Date().toISOString()
  });
}
