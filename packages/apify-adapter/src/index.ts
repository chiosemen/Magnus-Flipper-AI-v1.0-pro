/**
 * Apify Adapter Package
 * 
 * Thin wrapper around Apify client for actor execution.
 * Provides cost estimation and standardized result format.
 */

export { createApifyClient, getApifyClient } from "./client.js";
export {
  runActor,
  waitForActorRun,
  type RunActorInput,
  type ActorRunMeta,
  type ActorRunResult,
} from "./runActor.js";
export {
  estimateCostPerRun,
  estimateCostForRuns,
  getDefaultEstimatedMinutes,
  DEFAULT_ESTIMATED_MINUTES,
} from "./costEstimator.js";

