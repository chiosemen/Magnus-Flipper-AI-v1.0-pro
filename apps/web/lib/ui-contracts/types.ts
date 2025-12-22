/**
 * UI Contract Types
 *
 * These types enforce the "Never-Disappear" contract for all major UI sections.
 * Every section must have explicit loading, empty, error, and ready states.
 *
 * @rule Sections must ALWAYS render a shell, never return null based on data.
 */

export type UIState = "loading" | "empty" | "error" | "ready";

export interface SectionState<TData = unknown, TError = Error> {
  /**
   * Current UI state - drives what content to render
   */
  state: UIState;

  /**
   * Data payload - undefined during loading, null when empty, populated when ready
   */
  data?: TData | null;

  /**
   * Error object - only populated when state === "error"
   */
  error?: TError;

  /**
   * Optional metadata for debugging
   */
  metadata?: {
    lastFetch?: Date;
    retryCount?: number;
    source?: string;
  };
}

/**
 * Contract: Every major section must implement this interface
 */
export interface SectionContract {
  /**
   * Unique identifier for observability
   */
  sectionId: string;

  /**
   * Human-readable name for debugging
   */
  sectionName: string;

  /**
   * Current state - must never cause section to disappear
   */
  state: SectionState;

  /**
   * Render functions for each state - ALL required
   */
  renderers: {
    loading: () => React.ReactNode;
    empty: () => React.ReactNode;
    error: (error: Error) => React.ReactNode;
    ready: (data: unknown) => React.ReactNode;
  };
}

/**
 * Type guard to determine if data is ready
 */
export function isDataReady<T>(state: SectionState<T>): state is SectionState<T> & { data: T } {
  return state.state === "ready" && state.data != null;
}

/**
 * Type guard for error state
 */
export function hasError<T>(state: SectionState<T>): state is SectionState<T> & { error: Error } {
  return state.state === "error" && state.error != null;
}
