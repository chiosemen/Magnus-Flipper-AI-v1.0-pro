import { NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * STUB: Decoupled from @magnus-flipper-ai/tech-trade-core
 * Tech trade functionality disabled in web app
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    devices: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
  });
}
