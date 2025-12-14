import { NextRequest, NextResponse } from "next/server";
import { requireReadAuth } from "../_lib/auth";
import { prisma } from "@magnus-flipper-ai/core";

function normalizeChecks(payload: any) {
  const checks: any[] = Array.isArray(payload?.checks) ? payload.checks : [];
  // Key: id + severity + status + message (stable enough for operator diff)
  return new Map(
    checks.map((c) => {
      const key = `${c.id}::${c.severity}::${c.status}::${c.message ?? ""}`;
      return [key, c];
    })
  );
}

export async function GET(req: NextRequest) {
  if (!requireReadAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "Missing from/to parameters" },
      { status: 400 }
    );
  }

  try {
    const [runFrom, runTo] = await Promise.all([
      prisma.deployGuardianRun.findUnique({
        where: { id: from },
        select: { id: true, payload: true },
      }),
      prisma.deployGuardianRun.findUnique({
        where: { id: to },
        select: { id: true, payload: true },
      }),
    ]);

    if (!runFrom || !runTo) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const checksFrom = normalizeChecks(runFrom.payload);
    const checksTo = normalizeChecks(runTo.payload);

    const added: any[] = [];
    const removed: any[] = [];

    // Find added checks (in 'to' but not in 'from')
    for (const [key, check] of checksTo.entries()) {
      if (!checksFrom.has(key)) {
        added.push(check);
      }
    }

    // Find removed checks (in 'from' but not in 'to')
    for (const [key, check] of checksFrom.entries()) {
      if (!checksTo.has(key)) {
        removed.push(check);
      }
    }

    return NextResponse.json({
      from: runFrom.id,
      to: runTo.id,
      added,
      removed,
    });
  } catch (error) {
    console.error("Failed to compute diff:", error);
    return NextResponse.json({ error: "Failed to compute diff" }, { status: 500 });
  }
}
