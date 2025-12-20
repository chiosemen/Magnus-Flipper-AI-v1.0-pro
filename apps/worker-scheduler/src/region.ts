export type WorkerRegion = "US" | "UK";

function normalizeWorkerRegion(value: unknown): WorkerRegion | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  if (upper === "US") return "US";
  if (upper === "UK" || upper === "GB") return "UK";
  return null;
}

/**
 * Region scoping for workers (US/UK).
 *
 * IMPORTANT:
 * - Scheduler/runner deployments should set one of these env vars to avoid cross-region pool mixing.
 * - If unset, returns null to preserve backward compatibility in local/dev environments.
 */
export function getWorkerRegionFromEnv(): WorkerRegion | null {
  return (
    normalizeWorkerRegion(process.env.APP_REGION) ??
    normalizeWorkerRegion(process.env.WORKER_REGION) ??
    normalizeWorkerRegion(process.env.REGION) ??
    null
  );
}

