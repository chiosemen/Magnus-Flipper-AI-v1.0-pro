import { getSupabaseClient } from "./supabase.js";

export async function createJob(jobType: string, marketplace?: string, payload?: any) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase not configured for job queue");
  }

  const { data, error } = await supabase
    .from("job_queue")
    .insert({
      job_type: jobType,
      status: "pending",
      marketplace,
      payload,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating job:", error);
    throw error;
  }

  return data;
}

export async function claimJob(workerId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data: job, error } = await supabase
    .from("job_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at")
    .limit(1)
    .single();

  if (error || !job) {
    return null;
  }

  const { error: updateError } = await supabase
    .from("job_queue")
    .update({
      status: "active",
      worker_id: workerId,
      started_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  if (updateError) {
    console.error("Error claiming job:", updateError);
    return null;
  }

  return job;
}

export async function completeJob(jobId: string, result?: any) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("Supabase not configured for job completion");
    return;
  }

  const { error } = await supabase
    .from("job_queue")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      payload: result,
    })
    .eq("id", jobId);

  if (error) {
    console.error("Error completing job:", error);
  }
}

export async function failJob(jobId: string, errorMessage: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.error("Supabase not configured for job failure");
    return;
  }

  const { error } = await supabase
    .from("job_queue")
    .update({
      status: "failed",
      completed_at: new Date().toISOString(),
      error_message: errorMessage,
    })
    .eq("id", jobId);

  if (error) {
    console.error("Error failing job:", error);
  }
}
