export async function POST(req: Request) {
  const body = await req.json();

  console.log("🧪 FAKE INGEST JOB RECEIVED:", body);

  return Response.json({
    jobId: `fake-job-${Date.now()}`,
    status: "queued",
    receivedAt: new Date().toISOString(),
  });
}
