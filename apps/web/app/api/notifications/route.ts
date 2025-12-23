import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * STUB: Decoupled from @magnus-flipper-ai/queue
 * Notifications now served via database, not Redis
 */
export async function GET(req: Request) {
  return NextResponse.json({
    notifications: []
  });
}

export async function POST(req: Request) {
  return NextResponse.json({ ok: true });
}
