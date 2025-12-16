import { supabase } from "./supabase.js";

export async function logEvent(
  marketplace: string,
  event: string,
  options: {
    success?: boolean;
    latency_ms?: number;
    payload?: any;
  } = {}
) {
  const { error } = await supabase.from("scanner_telemetry").insert({
    marketplace,
    event,
    success: options.success ?? true,
    latency_ms: options.latency_ms,
    payload: options.payload,
  });

  if (error) {
    console.error("Error logging telemetry:", error);
  }
}

export async function sendHeartbeat(workerId: string) {
  const { error } = await supabase
    .from("worker_heartbeat")
    .upsert(
      {
        worker_id: workerId,
        status: "online",
        last_heartbeat: new Date().toISOString(),
      },
      {
        onConflict: "worker_id",
      }
    );

  if (error) {
    console.error("Error sending heartbeat:", error);
  }
}
