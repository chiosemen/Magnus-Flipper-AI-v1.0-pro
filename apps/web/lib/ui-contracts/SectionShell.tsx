/**
 * SectionShell - Enforces the Never-Disappear UI Contract
 *
 * This component guarantees that a section ALWAYS renders, regardless of data state.
 * It prevents the anti-pattern of conditional rendering based on data truthiness.
 *
 * @example
 * ```tsx
 * <SectionShell
 *   sectionId="car-flipper"
 *   state={sectionState}
 *   renderLoading={() => <CarFlipperSkeleton />}
 *   renderEmpty={() => <CarFlipperEmpty />}
 *   renderError={(err) => <CarFlipperError error={err} />}
 *   renderReady={(data) => <CarFlipperCards data={data} />}
 * />
 * ```
 */

import { ReactNode } from "react";
import { SectionState, UIState } from "./types";

export interface SectionShellProps<TData = unknown> {
  /**
   * Unique section identifier for debugging/observability
   */
  sectionId: string;

  /**
   * Current section state
   */
  state: SectionState<TData>;

  /**
   * Render function for loading state
   * REQUIRED - must provide skeleton/spinner
   */
  renderLoading: () => ReactNode;

  /**
   * Render function for empty state
   * REQUIRED - must explain what will appear when data exists
   */
  renderEmpty: () => ReactNode;

  /**
   * Render function for error state
   * REQUIRED - must provide retry mechanism or contact support
   */
  renderError: (error: Error) => ReactNode;

  /**
   * Render function for ready state with data
   * REQUIRED - the actual content
   */
  renderReady: (data: TData) => ReactNode;

  /**
   * Optional wrapper className
   */
  className?: string;

  /**
   * Optional data-testid for testing
   */
  testId?: string;
}

/**
 * SectionShell Component
 *
 * Contract enforcement:
 * 1. NEVER returns null
 * 2. ALWAYS renders a wrapper div with section metadata
 * 3. Forces explicit handling of all 4 states
 * 4. Provides observability attributes for debugging
 */
export function SectionShell<TData = unknown>({
  sectionId,
  state,
  renderLoading,
  renderEmpty,
  renderError,
  renderReady,
  className = "",
  testId,
}: SectionShellProps<TData>) {
  // Determine what to render based on state
  let content: ReactNode;

  switch (state.state) {
    case "loading":
      content = renderLoading();
      break;

    case "empty":
      content = renderEmpty();
      break;

    case "error":
      content = renderError(state.error || new Error("Unknown error"));
      break;

    case "ready":
      if (state.data == null) {
        // Defensive: if state is "ready" but data is null, treat as empty
        console.warn(
          `[SectionShell:${sectionId}] State is "ready" but data is null/undefined. Falling back to empty state.`
        );
        content = renderEmpty();
      } else {
        content = renderReady(state.data);
      }
      break;

    default: {
      // TypeScript exhaustiveness check - should never reach here
      const _exhaustive: never = state.state;
      console.error(`[SectionShell:${sectionId}] Unknown state:`, _exhaustive);
      content = renderError(new Error(`Unknown UI state: ${state.state}`));
    }
  }

  return (
    <div
      className={className}
      data-section-id={sectionId}
      data-section-state={state.state}
      data-testid={testId || `section-${sectionId}`}
      // Observability: helps track which sections are in which states
      data-last-fetch={state.metadata?.lastFetch?.toISOString()}
      data-retry-count={state.metadata?.retryCount}
      data-source={state.metadata?.source}
    >
      {content}
    </div>
  );
}

/**
 * Utility: Create section state from React Query result
 *
 * @example
 * ```tsx
 * const query = useQuery({ queryKey: ['deals'], queryFn: fetchDeals });
 * const sectionState = fromReactQuery(query);
 * ```
 */
export function fromReactQuery<TData>(
  query: {
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    data: TData | undefined;
  },
  options?: {
    treatUndefinedAsEmpty?: boolean;
  }
): SectionState<TData> {
  if (query.isLoading) {
    return {
      state: "loading",
      data: undefined,
      metadata: { source: "react-query" },
    };
  }

  if (query.isError) {
    return {
      state: "error",
      error: query.error || new Error("Query failed"),
      metadata: { source: "react-query" },
    };
  }

  // Data loaded successfully
  if (query.data == null || (Array.isArray(query.data) && query.data.length === 0)) {
    return {
      state: "empty",
      data: null,
      metadata: { source: "react-query" },
    };
  }

  return {
    state: "ready",
    data: query.data,
    metadata: { source: "react-query", lastFetch: new Date() },
  };
}

/**
 * Utility: Create section state from SSE/Realtime hook
 */
export function fromRealtimeHook<TData>(
  hook: {
    status: "disconnected" | "connecting" | "connected" | "error";
    data: TData[];
    error?: Error;
  }
): SectionState<TData[]> {
  switch (hook.status) {
    case "connecting":
    case "disconnected":
      return {
        state: "loading",
        data: undefined,
        metadata: { source: "realtime" },
      };

    case "error":
      return {
        state: "error",
        error: hook.error || new Error("Realtime connection failed"),
        metadata: { source: "realtime" },
      };

    case "connected":
      if (hook.data.length === 0) {
        return {
          state: "empty",
          data: null,
          metadata: { source: "realtime" },
        };
      }
      return {
        state: "ready",
        data: hook.data,
        metadata: { source: "realtime", lastFetch: new Date() },
      };
  }
}
