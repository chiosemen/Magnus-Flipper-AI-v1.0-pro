import { claimJob, completeJob, failJob } from "./queue.js";
import { logEvent } from "./telemetry.js";

export async function processJob(workerId: string, handler: (job: any) => Promise<any>) {
  const job = await claimJob(workerId);

  if (!job) {
    return null;
  }

  console.log(`Processing job ${job.id}: ${job.job_type}`);

  const startTime = Date.now();

  try {
    const result = await handler(job);
    const latency = Date.now() - startTime;

    await completeJob(job.id, result);
    await logEvent(job.marketplace || "system", `job_completed_${job.job_type}`, {
      success: true,
      latency_ms: latency,
      payload: { job_id: job.id },
    });

    console.log(`Job ${job.id} completed in ${latency}ms`);
    return result;
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await failJob(job.id, errorMessage);
    await logEvent(job.marketplace || "system", `job_failed_${job.job_type}`, {
      success: false,
      latency_ms: latency,
      payload: { job_id: job.id, error: errorMessage },
    });

    console.error(`Job ${job.id} failed:`, error);
    throw error;
  }
}
