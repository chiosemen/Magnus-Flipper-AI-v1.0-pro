import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEARTBEAT_STALE_SECONDS = 90;

function computeWindowStatus(now: Date, opensAt: Date, closesAt: Date) {
  if (now < opensAt) return "scheduled";
  if (now >= opensAt && now <= closesAt) return "active";
  return "closed";
}

export async function GET() {
  const supabase = supabaseAdmin();
  const now = new Date();

  // 1) Find the "best" window:
  // Prefer active; else next scheduled (soonest opens_at)
  const { data: activeWindow } = await supabase
    .from("scan_windows")
    .select("id, marketplace, opens_at, closes_at, status")
    .eq("status", "active")
    .order("opens_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let window = activeWindow;

  if (!window) {
    const { data: nextScheduled } = await supabase
      .from("scan_windows")
      .select("id, marketplace, opens_at, closes_at, status")
      .eq("status", "scheduled")
      .order("opens_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    window = nextScheduled ?? null;
  }

  // 2) Worker heartbeats (alive within last 90s)
  const cutoff = new Date(now.getTime() - HEARTBEAT_STALE_SECONDS * 1000).toISOString();
  const { data: aliveWorkers = [] } = await supabase
    .from("worker_heartbeats")
    .select("worker_id, worker_type, marketplace, state, last_seen_at, meta")
    .gte("last_seen_at", cutoff);

  const counts = aliveWorkers.reduce(
    (acc, w) => {
      if (w.state === "error") acc.error += 1;
      else if (w.state === "scanning") acc.active += 1;
      else acc.idle += 1;
      return acc;
    },
    { active: 0, idle: 0, error: 0 }
  );

  // 3) Derive countdown info
  let scanWindow: any = null;
  let nextWindowInSeconds: number | null = null;
  let closesInSeconds: number | null = null;

  if (window) {
    const opensAt = new Date(window.opens_at);
    const closesAt = new Date(window.closes_at);

    const derivedStatus = computeWindowStatus(now, opensAt, closesAt);

    scanWindow = {
      marketplace: window.marketplace,
      status: derivedStatus,
      opens_at: window.opens_at,
      closes_at: window.closes_at,
    };

    if (derivedStatus === "scheduled") {
      nextWindowInSeconds = Math.max(0, Math.floor((opensAt.getTime() - now.getTime()) / 1000));
    } else if (derivedStatus === "active") {
      closesInSeconds = Math.max(0, Math.floor((closesAt.getTime() - now.getTime()) / 1000));
    } else {
      // closed: try to compute next scheduled window quickly
      nextWindowInSeconds = null;
    }
  }

  return NextResponse.json({
    server_time: now.toISOString(),
    scan_window: scanWindow,
    workers: counts,
    alive_workers: aliveWorkers.map((w) => ({
      worker_id: w.worker_id,
      worker_type: w.worker_type,
      marketplace: w.marketplace,
      state: w.state,
      last_seen_at: w.last_seen_at,
      meta: w.meta ?? {},
    })),
    next_window_in_seconds: nextWindowInSeconds,
    closes_in_seconds: closesInSeconds,
  });
}
