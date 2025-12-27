import { NextResponse } from "next/server";
import { set } from "@vercel/edge-config";
import { requireAdminAPI } from "@/lib/auth/admin-guard";
import {
  asExecutionMode,
  getExecutionMode,
} from "@/lib/execution/edge-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const adminCheck = await requireAdminAPI();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const mode = await getExecutionMode();
  return NextResponse.json({ ok: true, mode });
}

export async function POST(req: Request) {
  const adminCheck = await requireAdminAPI();
  if (adminCheck instanceof NextResponse) {
    return adminCheck;
  }

  const body = (await req.json().catch(() => ({}))) as { mode?: unknown };
  const mode = asExecutionMode(body.mode);

  if (!mode) {
    return NextResponse.json(
      { ok: false, reason: "invalid_mode" },
      { status: 400 }
    );
  }

  try {
    await set("execution_mode", mode);
    return NextResponse.json({ ok: true, mode, source: "edge-config" });
  } catch (error) {
    console.error("[execution-mode] Edge Config write failed:", error);
    return NextResponse.json(
      { ok: false, reason: "edge_config_write_failed" },
      { status: 200 }
    );
  }
}
