import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HeartbeatPayload = {
  worker_id: string;
  worker_type: string;
  marketplace?: string | null;
  state: "idle" | "scanning" | "cooldown" | "error";
  meta?: Record<string, any>;
  token?: string; // optional shared secret
};

// Optional shared secret to prevent random POSTs
function assertToken(body: HeartbeatPayload) {
  const required = process.env.HEARTBEAT_TOKEN;
  if (!required) return; // if unset, skip
  if (!body.token || body.token !== required) {
    throw new Error("Unauthorized heartbeat");
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as HeartbeatPayload;
    assertToken(body);

    if (!body.worker_id || !body.worker_type || !body.state) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("worker_heartbeats")
      .upsert(
        {
          worker_id: body.worker_id,
          worker_type: body.worker_type,
          marketplace: body.marketplace ?? null,
          state: body.state,
          last_seen_at: now,
          meta: body.meta ?? {},
        },
        { onConflict: "worker_id" }
      );

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Unknown error" },
      { status: 401 }
    );
  }
}
