import { NextResponse } from "next/server";
import { parseConnectionString } from "@vercel/edge-config";
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
    const connectionString = process.env.EDGE_CONFIG;
    if (!connectionString) {
      console.warn("[execution-mode] EDGE_CONFIG missing.");
      return NextResponse.json(
        { ok: false, reason: "edge_config_write_failed" },
        { status: 200 }
      );
    }

    const connection = parseConnectionString(connectionString);
    if (!connection) {
      console.warn("[execution-mode] EDGE_CONFIG connection string invalid.");
      return NextResponse.json(
        { ok: false, reason: "edge_config_write_failed" },
        { status: 200 }
      );
    }
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${connection.id}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${connection.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ key: "execution_mode", value: mode }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[execution-mode] Edge Config write failed:", errorText);
      return NextResponse.json(
        { ok: false, reason: "edge_config_write_failed" },
        { status: 200 }
      );
    }

    return NextResponse.json({ ok: true, mode, source: "edge-config" });
  } catch (error) {
    console.error("[execution-mode] Edge Config write failed:", error);
    return NextResponse.json(
      { ok: false, reason: "edge_config_write_failed" },
      { status: 200 }
    );
  }
}
