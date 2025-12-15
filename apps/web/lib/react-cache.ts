/**
 * React cache() polyfill for TypeScript compatibility
 * 
 * React 18+ includes cache() for Server Components, but TypeScript types
 * may not include it yet. This provides a type-safe wrapper that uses
 * React's actual cache() at runtime.
 * 
 * @see https://react.dev/reference/react/cache
 */

// Import React to access cache() at runtime
import * as React from "react";

// Type-safe cache function that uses React's cache() at runtime
export function cache<T extends (...args: any[]) => any>(fn: T): T {
  // React.cache exists at runtime in React 18+, but TypeScript types may not include it
  // Use type assertion to access cache() safely
  const reactCache = (React as any).cache;
  if (reactCache) {
    return reactCache(fn);
  }
  // Fallback if cache is not available (shouldn't happen in React 18+)
  return fn;
}
