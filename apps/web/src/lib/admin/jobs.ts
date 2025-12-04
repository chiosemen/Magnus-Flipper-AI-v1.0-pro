// apps/web/src/lib/admin/jobs.ts

/**
 * Job management wrapper
 * Queries Supabase job_queue and worker_heartbeat tables
 * 
 * NOTE: No agentic-engine function exists for job queue management.
 * This wrapper queries Supabase directly which is the source of truth.
 * 
 * PERFORMANCE: Uses React cache() for request-level deduplication
 * and Promise.all for parallel queries
 */

import { cache } from "react";
import { createServerClient } from "@/lib/supabase";
import { withTrace, logError } from "@/lib/observability/logger";
import { createTraceContext } from "@/lib/observability/correlation";
import { recordLatency } from "@/lib/observability/metrics";

// Memoized version for React Server Components (deduplicates within request)
const fetchAllJobsInternal = cache(async () => {
  const context = await createTraceContext({ module: "admin/jobs" });
  
  return withTrace(async () => {
    const supabase = await createServerClient();

    // PERFORMANCE: Parallel queries instead of sequential
    const [jobsResult, workersResult] = await Promise.all([
      supabase
        .from("job_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("worker_heartbeat")
        .select("*")
        .order("last_heartbeat", { ascending: false }),
    ]);

    const { data: jobs, error: jobsError } = jobsResult;
    const { data: workers, error: workersError } = workersResult;

    if (jobsError) {
      logError("Error fetching jobs", { ...context, error: jobsError });
      throw jobsError;
    }

    if (workersError) {
      logError("Error fetching workers", { ...context, error: workersError });
      throw workersError;
    }

    // Transform jobs to match expected format
    const transformedJobs = (jobs || []).map((job) => ({
      id: job.id,
      job_type: job.job_type,
      marketplace: job.marketplace || null,
      status: job.status,
      worker_id: job.worker_id || null,
      started_at: job.started_at || null,
      completed_at: job.completed_at || null,
      created_at: job.created_at,
    }));

    // Transform workers to match expected format
    const transformedWorkers = (workers || []).map((worker) => ({
      id: worker.id,
      worker_id: worker.worker_id,
      status: worker.status === "online" ? "idle" : "offline",
      currentJob: null, // TODO: Query active jobs to determine current job
      jobsCompleted: 0, // TODO: Count completed jobs per worker
      last_heartbeat: worker.last_heartbeat,
    }));

    return {
      jobs: transformedJobs,
      workers: transformedWorkers,
    };
  }, context).catch((error) => {
    logError("ADMIN JOBS ERROR: fetchAllJobs failed", { ...context, error }, 'high', 'database');
    // Return empty arrays on error
    return {
      jobs: [],
      workers: [],
    };
  });
});

// Export cached version for use in Server Components
export const fetchAllJobs = fetchAllJobsInternal;

// Memoized version for React Server Components
const getJobByIdInternal = cache(async (id: string) => {
  const context = await createTraceContext({ module: "admin/jobs", jobId: id });
  
  return withTrace(async () => {
    const supabase = await createServerClient();

    const { data: job, error } = await supabase
      .from("job_queue")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      logError("Error fetching job by id", { ...context, error });
      throw error;
    }

    if (!job) {
      return null;
    }

    return {
      id: job.id,
      job_type: job.job_type,
      marketplace: job.marketplace || null,
      status: job.status,
      worker_id: job.worker_id || null,
      started_at: job.started_at || null,
      completed_at: job.completed_at || null,
      created_at: job.created_at,
    };
  }, context);
});

export const getJobById = getJobByIdInternal;
