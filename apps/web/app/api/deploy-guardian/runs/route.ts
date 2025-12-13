import { NextRequest, NextResponse } from "next/server";
import { requireIngestAuth, requireReadAuth } from "../_lib/auth";
import { prisma } from "@magnus-flipper-ai/core";

type DGPayload = {
  contract?: {
    name?: string;
    version?: string;
    schema?: string;
    schemaSha256?: string;
  };
  tool?: {
    name?: string;
    version?: string;
    timestamp?: string;
    commitSha?: string;
    runId?: string;
  };
  context?: {
    mode?: string;
    environment?: string;
    repo?: string;
    branch?: string;
    actor?: string;
    workflow?: string;
  };
  verdict?: {
    status?: "SAFE" | "UNSAFE";
    exitCode?: number;
    blockers?: number;
    warnings?: number;
    passed?: number;
    skipped?: number;
    durationMs?: number;
  };
  checks?: Array<{
    id: string;
    status: "PASS" | "WARN" | "FAIL" | "SKIP";
    severity: "BLOCKER" | "WARNING" | "INFO";
    message?: string;
    details?: any;
  }>;
};

export async function POST(req: NextRequest) {
  // CI ingestion gate
  if (!requireIngestAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: DGPayload;
  try {
    payload = (await req.json()) as DGPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Extract contract metadata (v2.1.0+)
  const contractVersion = payload.contract?.version ?? null;
  const contractSchemaHash = payload.contract?.schemaSha256 ?? null;

  // Extract provenance
  const mode = payload.context?.mode ?? "pre-deploy";
  const environment = payload.context?.environment ?? "production";
  const status = payload.verdict?.status === "SAFE" ? "pass" : "fail";

  const blockers = payload.verdict?.blockers ?? 0;
  const warnings = payload.verdict?.warnings ?? 0;
  const infos = payload.verdict?.skipped ?? 0; // Approximate

  const commitSha = payload.tool?.commitSha ?? payload.context?.repo ?? null;
  const actor = payload.context?.actor ?? null;
  const workflow = payload.context?.workflow ?? null;
  const runId = payload.tool?.runId ?? null;
  const branch = payload.context?.branch ?? null;

  try {
    const created = await prisma.deployGuardianRun.create({
      data: {
        mode,
        environment,
        status,
        contractVersion,
        contractSchemaHash,
        blockers,
        warnings,
        infos,
        commitSha,
        actor,
        workflow,
        runId,
        branch,
        payload: payload as any,
      },
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
      },
    });

    return NextResponse.json({ ok: true, run: created }, { status: 201 });
  } catch (error: any) {
    // Handle unique constraint violation (duplicate run_id)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate run_id", field: "run_id" },
        { status: 409 }
      );
    }
    console.error("Failed to create deploy guardian run:", error);
    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  if (!requireReadAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
  const environment = searchParams.get("environment") ?? undefined;

  try {
    const runs = await prisma.deployGuardianRun.findMany({
      where: environment ? { environment } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
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
      },
    });

    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Failed to fetch deploy guardian runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}
