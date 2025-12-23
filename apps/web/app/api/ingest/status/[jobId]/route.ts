import { NextResponse } from "next/server";

// Force dynamic rendering - this route must run at request time, never at build time
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * STUB: Decoupled from @magnus-flipper-ai/queue
 * Job status tracking disabled - workers handle scraping independently
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  return NextResponse.json(
    {
      error: "Job status tracking disabled. Background workers operate independently.",
      jobId
    },
    { status: 503 }
  );
}
