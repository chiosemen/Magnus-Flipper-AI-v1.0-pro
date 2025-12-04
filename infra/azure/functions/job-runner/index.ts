import { AzureFunction, Context } from "@azure/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const WORKER_ID = process.env.AZURE_WORKER_ID || "azure-worker-001";

interface Job {
  id: string;
  job_type: string;
  marketplace?: string;
  payload?: any;
  status: string;
  created_at: string;
}

async function claimJob(): Promise<Job | null> {
  const { data, error } = await supabase
    .from("job_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  const { error: updateError } = await supabase
    .from("job_queue")
    .update({
      status: "processing",
      started_at: new Date().toISOString(),
      worker_id: WORKER_ID,
    })
    .eq("id", data.id)
    .eq("status", "pending");

  if (updateError) {
    return null;
  }

  return data;
}

async function completeJob(jobId: string, result: any): Promise<void> {
  await supabase
    .from("job_queue")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      result,
    })
    .eq("id", jobId);
}

async function failJob(jobId: string, error: string): Promise<void> {
  await supabase
    .from("job_queue")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error,
    })
    .eq("id", jobId);
}

async function logEvent(
  marketplace: string,
  event: string,
  options: {
    success?: boolean;
    latency_ms?: number;
    payload?: any;
  } = {}
): Promise<void> {
  await supabase.from("scanner_telemetry").insert({
    marketplace,
    event,
    success: options.success ?? true,
    latency_ms: options.latency_ms,
    payload: options.payload,
  });
}

async function processJob(job: Job): Promise<any> {
  const startTime = Date.now();

  try {
    if (job.job_type === "scan_marketplace" && job.marketplace) {
      // Trigger the worker to scan this marketplace
      // In a real implementation, this would call the actual scraper
      // For now, we log the event
      await logEvent(job.marketplace, "scan_triggered", {
        success: true,
        payload: { job_id: job.id, worker_id: WORKER_ID },
      });

      return { success: true, marketplace: job.marketplace };
    }

    // Handle other job types
    return { success: true, message: "Job processed" };
  } catch (error) {
    const latency = Date.now() - startTime;
    await logEvent(job.marketplace || "system", `job_failed_${job.job_type}`, {
      success: false,
      latency_ms: latency,
      payload: {
        job_id: job.id,
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}

const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const timeStamp = new Date().toISOString();

  if (myTimer.isPastDue) {
    context.log("Timer function is running late!");
  }

  try {
    // Send heartbeat
    await supabase.from("worker_heartbeat").upsert(
      {
        worker_id: WORKER_ID,
        status: "online",
        last_heartbeat: timeStamp,
      },
      {
        onConflict: "worker_id",
      }
    );

    // Claim and process one job
    const job = await claimJob();

    if (!job) {
      context.log("No pending jobs found");
      return;
    }

    context.log(`Processing job ${job.id}: ${job.job_type}`);

    const startTime = Date.now();
    const result = await processJob(job);
    const latency = Date.now() - startTime;

    await completeJob(job.id, result);

    await logEvent(job.marketplace || "system", `job_completed_${job.job_type}`, {
      success: true,
      latency_ms: latency,
      payload: { job_id: job.id, worker_id: WORKER_ID },
    });

    context.log(`Job ${job.id} completed successfully in ${latency}ms`);
  } catch (error) {
    context.log.error("Error processing job:", error);

    if (error instanceof Error && (error as any).jobId) {
      await failJob(
        (error as any).jobId,
        error.message || "Unknown error"
      );
    }
  }
};

export default timerTrigger;
