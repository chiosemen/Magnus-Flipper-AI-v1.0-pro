import { Queue } from "bullmq";
import { redis } from "./redis.js";
import type {
  ScrapeJob,
  ParentJob,
  DealerJob,
  SchedulerTickJob,
  FbScrapeJob,
  AlertDispatchJob,
} from "./types.js";

/**
 * Lazy queue instantiation to prevent build-time Redis connections.
 * 
 * CRITICAL BUILD-TIME GUARD:
 * - Never instantiates during `next build` (when NEXT_PHASE === 'phase-production-build')
 * - Never instantiates during static page generation
 * - Only instantiates during actual runtime request handling
 * 
 * Without this guard, Next.js static analysis triggers Queue→Redis connection during build,
 * causing ECONNREFUSED errors when Redis isn't available.
 */

let _ingestQueue: Queue<ScrapeJob | ParentJob> | null = null;
let _dealerQueue: Queue<DealerJob> | null = null;
let _schedulerQueue: Queue<SchedulerTickJob> | null = null;
let _fbScrapeQueue: Queue<FbScrapeJob> | null = null;
let _alertDispatchQueue: Queue<AlertDispatchJob> | null = null;

function getIngestQueue(): Queue<ScrapeJob | ParentJob> {
  if (_ingestQueue) return _ingestQueue;

  // EXECUTION CONTEXT GUARD: Prevent instantiation during build phase
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      "Queue cannot be accessed during build time. This is likely a bug - " +
      "Queues should only be used in API routes or server actions at runtime."
    );
  }

  _ingestQueue = new Queue<ScrapeJob | ParentJob>("ingest", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 500 },
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 3000,
      },
    },
  });

  return _ingestQueue;
}

function getDealerQueue(): Queue<DealerJob> | null {
  // Check feature flag (only once per process)
  if (process.env.DEALER_ENGINE_ENABLED !== "true") {
    return null;
  }

  if (_dealerQueue) return _dealerQueue;

  // EXECUTION CONTEXT GUARD: Prevent instantiation during build phase
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      "Queue cannot be accessed during build time. This is likely a bug - " +
      "Queues should only be used in API routes or server actions at runtime."
    );
  }

  _dealerQueue = new Queue<DealerJob>("used-car-dealer-queue", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 500 },
      attempts: 2,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  });

  return _dealerQueue;
}

function getSchedulerQueue(): Queue<SchedulerTickJob> {
  if (_schedulerQueue) return _schedulerQueue;

  // EXECUTION CONTEXT GUARD: Prevent instantiation during build phase
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      "Queue cannot be accessed during build time. This is likely a bug - " +
      "Queues should only be used in API routes or server actions at runtime."
    );
  }

  _schedulerQueue = new Queue<SchedulerTickJob>("scheduler", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 500 },
    },
  });

  return _schedulerQueue;
}

function getFbScrapeQueue(): Queue<FbScrapeJob> {
  if (_fbScrapeQueue) return _fbScrapeQueue;

  // EXECUTION CONTEXT GUARD: Prevent instantiation during build phase
  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      "Queue cannot be accessed during build time. This is likely a bug - " +
      "Queues should only be used in API routes or server actions at runtime."
    );
  }

  _fbScrapeQueue = new Queue<FbScrapeJob>("fb-scrape", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 500 },
      attempts: 3,
      backoff: { type: "exponential", delay: 30_000 },
    },
  });

  return _fbScrapeQueue;
}

function getAlertDispatchQueue(): Queue<AlertDispatchJob> {
  if (_alertDispatchQueue) return _alertDispatchQueue;

  if (process.env.NEXT_PHASE === "phase-production-build") {
    throw new Error(
      "Queue cannot be accessed during build time. This is likely a bug - " +
        "Queues should only be used in API routes or server actions at runtime."
    );
  }

  _alertDispatchQueue = new Queue<AlertDispatchJob>("alert-dispatch", {
    connection: redis,
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 1000 },
      attempts: 3,
      backoff: { type: "exponential", delay: 10_000 },
    },
  });

  return _alertDispatchQueue;
}

/**
 * Lazy Queue instances using Proxy.
 * All property access and method calls are forwarded to the underlying instance.
 * The instance is only created when first accessed (not at import time).
 */
export const ingestQueue = new Proxy({} as Queue<ScrapeJob | ParentJob>, {
  get(target, prop) {
    const instance = getIngestQueue();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const dealerQueue = new Proxy({} as any, {
  get(target, prop) {
    const instance = getDealerQueue();
    if (!instance) return null;
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
}) as Queue<DealerJob> | null;

export const schedulerQueue = new Proxy({} as Queue<SchedulerTickJob>, {
  get(target, prop) {
    const instance = getSchedulerQueue();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const fbScrapeQueue = new Proxy({} as Queue<FbScrapeJob>, {
  get(target, prop) {
    const instance = getFbScrapeQueue();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export const alertDispatchQueue = new Proxy({} as Queue<AlertDispatchJob>, {
  get(_target, prop) {
    const instance = getAlertDispatchQueue();
    const value = (instance as any)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
