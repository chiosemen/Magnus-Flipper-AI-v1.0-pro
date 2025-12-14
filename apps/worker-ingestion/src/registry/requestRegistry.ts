/**
 * In-memory request registry for tracking ingestion runs
 * Keyed by requestId
 */

import type {
  IngestStatusResponse,
  IngestResultsResponse,
  SearchResult,
} from "../types/schemas.js";

export type RequestStatus = "queued" | "running" | "completed" | "partial" | "failed";

export interface RequestState {
  requestId: string;
  status: RequestStatus;
  startedAt: string;
  updatedAt: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
  results: SearchResult[];
  searchPromises: Map<string, Promise<SearchResult>>;
  geo?: "US" | "UK";
}

class RequestRegistry {
  private requests = new Map<string, RequestState>();
  private startTime = Date.now();

  /**
   * Register a new request
   */
  register(requestId: string, totalSearches: number, geo?: "US" | "UK"): RequestState {
    const now = new Date().toISOString();
    const state: RequestState = {
      requestId,
      status: "queued",
      startedAt: now,
      updatedAt: now,
      progress: {
        total: totalSearches,
        completed: 0,
        failed: 0,
      },
      results: [],
      searchPromises: new Map(),
      geo,
    };

    this.requests.set(requestId, state);
    return state;
  }

  /**
   * Get request state
   */
  get(requestId: string): RequestState | undefined {
    return this.requests.get(requestId);
  }

  /**
   * Update request status
   */
  updateStatus(requestId: string, status: RequestStatus): void {
    const state = this.requests.get(requestId);
    if (state) {
      state.status = status;
      state.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Mark a search as completed
   */
  markSearchCompleted(requestId: string, result: SearchResult): void {
    const state = this.requests.get(requestId);
    if (state) {
      state.results.push(result);
      state.progress.completed++;
      state.updatedAt = new Date().toISOString();

      // Update overall status
      if (state.progress.completed + state.progress.failed === state.progress.total) {
        if (state.progress.failed === 0) {
          state.status = "completed";
        } else if (state.progress.completed > 0) {
          state.status = "partial";
        } else {
          state.status = "failed";
        }
      } else {
        state.status = "running";
      }
    }
  }

  /**
   * Mark a search as failed
   */
  markSearchFailed(requestId: string, searchId: string, error: string): void {
    const state = this.requests.get(requestId);
    if (state) {
      state.progress.failed++;
      state.updatedAt = new Date().toISOString();

      // Create failed result entry
      const failedResult: SearchResult = {
        marketplace: "",
        searchId,
        query: "",
        listingsFound: 0,
        durationMs: 0,
        items: [],
      };

      state.results.push(failedResult);

      // Update overall status
      if (state.progress.completed + state.progress.failed === state.progress.total) {
        if (state.progress.completed > 0) {
          state.status = "partial";
        } else {
          state.status = "failed";
        }
      } else {
        state.status = "running";
      }
    }
  }

  /**
   * Store a search promise for tracking
   */
  setSearchPromise(requestId: string, searchId: string, promise: Promise<SearchResult>): void {
    const state = this.requests.get(requestId);
    if (state) {
      state.searchPromises.set(searchId, promise);
    }
  }

  /**
   * Get status response
   */
  getStatus(requestId: string): IngestStatusResponse | null {
    const state = this.requests.get(requestId);
    if (!state) {
      return null;
    }

    return {
      requestId: state.requestId,
      status: state.status,
      progress: { ...state.progress },
      startedAt: state.startedAt,
      updatedAt: state.updatedAt,
    };
  }

  /**
   * Get results response
   */
  getResults(requestId: string): IngestResultsResponse | null {
    const state = this.requests.get(requestId);
    if (!state) {
      return null;
    }

    return {
      requestId: state.requestId,
      mode: "db-lite",
      completedAt: state.updatedAt,
      results: [...state.results],
    };
  }

  /**
   * Get uptime in seconds
   */
  getUptimeSec(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Cleanup old requests (optional, for memory management)
   */
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [requestId, state] of this.requests.entries()) {
      const age = now - new Date(state.startedAt).getTime();
      if (age > maxAgeMs && (state.status === "completed" || state.status === "failed")) {
        this.requests.delete(requestId);
      }
    }
  }
}

export const requestRegistry = new RequestRegistry();
