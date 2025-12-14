/**
 * Ingestion routes
 * POST /ingest/run
 * GET /ingest/status/:requestId
 * GET /ingest/results/:requestId
 */

import express from "express";
import { ScraperOrchestrator } from "@magnus-flipper-ai/scraper-sync";
import {
  IngestRunRequestSchema,
  type IngestRunRequest,
} from "../types/schemas.js";
import { requestRegistry } from "../registry/requestRegistry.js";
import { runSearch } from "../services/scraper.js";
import { concurrencyManager } from "../services/concurrency.js";

const router = express.Router();

// Initialize orchestrator (db-lite mode, no Supabase needed)
const orchestrator = new ScraperOrchestrator("", "");

/**
 * POST /ingest/run
 * Trigger ingestion run for one or more marketplaces and queries
 */
router.post("/run", async (req, res) => {
  try {
    // Validate request body
    const validationResult = IngestRunRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "InvalidRequest",
        message: validationResult.error.errors[0]?.message || "Invalid request body",
      });
    }

    const request: IngestRunRequest = validationResult.data;

    // Validate mode
    if (request.mode !== "db-lite") {
      return res.status(400).json({
        error: "InvalidRequest",
        message: 'mode must be "db-lite" in v1',
      });
    }

    // Validate marketplaces
    const invalidMarketplaces: string[] = [];
    for (const marketplace of request.marketplaces) {
      const validMarketplaces = ["facebook", "gumtree", "vinted", "craigslist", "ebay", "depop"];
      if (!validMarketplaces.includes(marketplace.toLowerCase())) {
        invalidMarketplaces.push(marketplace);
      }
    }

    if (invalidMarketplaces.length > 0) {
      return res.status(400).json({
        error: "InvalidRequest",
        message: `Unknown marketplace(s): ${invalidMarketplaces.join(", ")}`,
      });
    }

    // Check concurrency limits
    const concurrencyIssues: string[] = [];
    const marketplaceCounts = new Map<string, number>();
    
    for (const search of request.searches) {
      const count = marketplaceCounts.get(search.marketplace) || 0;
      marketplaceCounts.set(search.marketplace, count + 1);
    }

    for (const [marketplace, requestedCount] of marketplaceCounts.entries()) {
      const active = concurrencyManager.getActive(marketplace);
      const available = 10 - active;
      if (requestedCount > available) {
        concurrencyIssues.push(
          `${marketplace}: ${requestedCount} requested, ${available} available (max 10 concurrent)`
        );
      }
    }

    if (concurrencyIssues.length > 0) {
      return res.status(429).json({
        error: "ConcurrencyExceeded",
        message: `Concurrency limits exceeded: ${concurrencyIssues.join("; ")}`,
      });
    }

    // Register request
    const state = requestRegistry.register(request.requestId, request.searches.length, request.geo);
    state.status = "running";
    state.updatedAt = new Date().toISOString();

    // Estimate duration (rough estimate: 60 seconds per search)
    const estimatedDurationSec = request.searches.length * 60;

    // Start processing searches asynchronously
    processSearches(request.requestId, request.searches, request.geo).catch((error) => {
      console.error(`[${request.requestId}] Error processing searches:`, error);
      requestRegistry.updateStatus(request.requestId, "failed");
    });

    // Return 202 Accepted
    res.status(202).json({
      requestId: request.requestId,
      status: "accepted" as const,
      startedAt: state.startedAt,
      estimatedDurationSec,
    });
  } catch (error: any) {
    console.error("Error in POST /ingest/run:", error);
    res.status(500).json({
      error: "InternalServerError",
      message: error.message || "Internal server error",
    });
  }
});

/**
 * Process searches asynchronously
 */
async function processSearches(
  requestId: string,
  searches: IngestRunRequest["searches"],
  geo?: "US" | "UK"
): Promise<void> {
  const promises = searches.map(async (search) => {
    try {
      const result = await runSearch(orchestrator, search, geo);
      requestRegistry.markSearchCompleted(requestId, result);
    } catch (error: any) {
      console.error(`[${requestId}] Search ${search.searchId} failed:`, error);
      requestRegistry.markSearchFailed(requestId, search.searchId, error.message);
    }
  });

  await Promise.allSettled(promises);
}

/**
 * GET /ingest/status/:requestId
 * Poll run status
 */
router.get("/status/:requestId", (req, res) => {
  const { requestId } = req.params;

  const status = requestRegistry.getStatus(requestId);

  if (!status) {
    return res.status(404).json({
      error: "NotFound",
      message: `Request ${requestId} not found`,
    });
  }

  res.json(status);
});

/**
 * GET /ingest/results/:requestId
 * Fetch results for a completed run
 */
router.get("/results/:requestId", (req, res) => {
  const { requestId } = req.params;

  const results = requestRegistry.getResults(requestId);

  if (!results) {
    return res.status(404).json({
      error: "NotFound",
      message: `Request ${requestId} not found`,
    });
  }

  res.json(results);
});

export default router;
