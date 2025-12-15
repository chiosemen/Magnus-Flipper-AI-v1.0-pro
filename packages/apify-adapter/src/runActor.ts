import { getApifyClient } from "./client.js";
import { estimateCostPerRun, getDefaultEstimatedMinutes } from "./costEstimator.js";

/**
 * Input for running an Apify actor
 */
export interface RunActorInput {
  actorId: string;
  input: Record<string, any>;
  timeout?: number; // Timeout in seconds (default: 300)
  budget?: number; // Max cost in USD (optional)
}

/**
 * Metadata about the actor run
 */
export interface ActorRunMeta {
  runId: string;
  status: string;
  durationSeconds: number;
  estimatedCostUSD: number;
}

/**
 * Result from running an Apify actor
 */
export interface ActorRunResult {
  items: any[];
  meta: ActorRunMeta;
}

/**
 * Run an Apify actor and return results
 * 
 * @param params Actor run parameters
 * @returns Actor results and metadata
 */
export async function runActor(params: RunActorInput): Promise<ActorRunResult> {
  const { actorId, input, timeout = 300, budget } = params;
  
  const client = getApifyClient();
  const startTime = Date.now();
  
  try {
    // Start actor run
    // Note: timeout handling is done via waitForFinish option or manual polling
    const run = await client.actor(actorId).call(input);
    
    const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
    
    // Fetch dataset items
    const dataset = await client.dataset(run.defaultDatasetId).listItems();
    const items = dataset.items || [];
    
    // Estimate cost
    const estimatedMinutes = durationSeconds / 60;
    const estimatedCostUSD = estimateCostPerRun(estimatedMinutes, true);
    
    // Check budget if provided
    if (budget && estimatedCostUSD > budget) {
      throw new Error(
        `Estimated cost ($${estimatedCostUSD.toFixed(2)}) exceeds budget ($${budget.toFixed(2)})`
      );
    }
    
    return {
      items,
      meta: {
        runId: run.id,
        status: run.status,
        durationSeconds,
        estimatedCostUSD,
      },
    };
  } catch (error) {
    // If timeout or other error, still try to get partial results
    if (error instanceof Error && error.message.includes("timeout")) {
      // Try to get partial results if available
      try {
        const runs = await client.actor(actorId).runs().list({ limit: 1 });
        if (runs.items.length > 0) {
          const latestRun = runs.items[0];
          const dataset = await client.dataset(latestRun.defaultDatasetId).listItems();
          
          const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
          const estimatedMinutes = durationSeconds / 60;
          const estimatedCostUSD = estimateCostPerRun(estimatedMinutes, true);
          
          return {
            items: dataset.items || [],
            meta: {
              runId: latestRun.id,
              status: latestRun.status,
              durationSeconds,
              estimatedCostUSD,
            },
          };
        }
      } catch {
        // Ignore errors fetching partial results
      }
    }
    
    throw error;
  }
}

/**
 * Wait for actor run to complete and return results
 * 
 * This is a convenience wrapper around runActor that provides
 * better error handling and status updates.
 */
export async function waitForActorRun(
  actorId: string,
  runId: string,
  pollIntervalMs: number = 5000
): Promise<ActorRunResult> {
  const client = getApifyClient();
  const startTime = Date.now();
  
  // Poll for completion
  while (true) {
    const run = await client.run(runId).get();
    
    if (!run) {
      throw new Error(`Actor run ${runId} not found`);
    }
    
    if (run.status === "SUCCEEDED") {
      // Fetch results
      const dataset = await client.dataset(run.defaultDatasetId).listItems();
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      const estimatedMinutes = durationSeconds / 60;
      const estimatedCostUSD = estimateCostPerRun(estimatedMinutes, true);
      
      return {
        items: dataset.items || [],
        meta: {
          runId: run.id,
          status: run.status,
          durationSeconds,
          estimatedCostUSD,
        },
      };
    }
    
    if (run.status === "FAILED" || run.status === "ABORTED") {
      throw new Error(`Actor run ${runId} failed with status: ${run.status}`);
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
}

