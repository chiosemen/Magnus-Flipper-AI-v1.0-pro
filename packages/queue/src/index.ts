export function initQueueSystem() {
  console.log("[queue] Redis-free mode: no-op initialized.");
}

export function enqueueJob() {
  console.warn("[queue] enqueueJob() called, but queue system is disabled.");
}

export function getQueueStatus() {
  return {
    enabled: false,
    backend: "none",
    message: "Redis-free mode",
    timestamp: new Date().toISOString(),
  };
}
