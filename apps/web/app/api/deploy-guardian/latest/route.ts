import { NextRequest, NextResponse } from "next/server";
import { requireReadAuth } from "../_lib/auth";
import { prisma } from "@magnus-flipper-ai/core";

export async function GET(req: NextRequest) {
  if (!requireReadAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const environment = searchParams.get("environment") ?? "production";

  try {
    const latest = await prisma.deployGuardianRun.findFirst({
      where: { environment },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        status: true,
        mode: true,
        environment: true,
        blockers: true,
        warnings: true,
        infos: true,
        commitSha: true,
        actor: true,
        workflow: true,
        runId: true,
        branch: true,
        contractVersion: true,
        contractSchemaHash: true,
        payload: true,
      },
    });

    return NextResponse.json({ latest });
  } catch (error) {
    console.error("Failed to fetch latest deploy guardian run:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest run" },
      { status: 500 }
    );
  }
}
