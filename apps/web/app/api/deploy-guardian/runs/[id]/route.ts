import { NextRequest, NextResponse } from "next/server";
import { requireReadAuth } from "../../_lib/auth";
import { prisma } from "@magnus-flipper-ai/core";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireReadAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const run = await prisma.deployGuardianRun.findUnique({
      where: { id: params.id },
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

    if (!run) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ run });
  } catch (error) {
    console.error("Failed to fetch deploy guardian run:", error);
    return NextResponse.json(
      { error: "Failed to fetch run" },
      { status: 500 }
    );
  }
}
