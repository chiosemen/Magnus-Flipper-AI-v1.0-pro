/**
 * Correlation ID / Request ID Management
 * Generates and tracks unique IDs per request for tracing
 * 
 * PERFORMANCE: Uses React cache() to deduplicate correlation ID retrieval
 */

import { cache } from '@/lib/react-cache';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

const CORRELATION_ID_HEADER = 'x-correlation-id';
const TRACE_ID_HEADER = 'x-trace-id';

/**
 * Generate a unique correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get correlation ID from request headers or generate new one
 */
export function getCorrelationIdFromRequest(request: NextRequest): string {
  try {
    const existingId = 
      request.headers.get(CORRELATION_ID_HEADER) ||
      request.headers.get(TRACE_ID_HEADER) ||
      request.headers.get('x-request-id');
    
    return existingId || generateCorrelationId();
  } catch (err) {
    // Fail-safe: always return an ID
    return generateCorrelationId();
  }
}

/**
 * Get correlation ID from Next.js headers (server components)
 * PERFORMANCE: Cached to avoid repeated header reads in same request
 */
export const getCorrelationId = cache(async (): Promise<string> => {
  try {
    const headersList = await headers();
    const existingId = 
      headersList.get(CORRELATION_ID_HEADER) ||
      headersList.get(TRACE_ID_HEADER) ||
      headersList.get('x-request-id');
    
    return existingId || generateCorrelationId();
  } catch (err) {
    // Fail-safe: always return an ID
    return generateCorrelationId();
  }
});

/**
 * Add correlation ID to response headers
 */
export function addCorrelationIdToResponse<T extends Response>(
  response: T,
  correlationId: string
): T {
  try {
    response.headers.set(CORRELATION_ID_HEADER, correlationId);
    response.headers.set(TRACE_ID_HEADER, correlationId);
    return response;
  } catch (err) {
    // Fail-safe: return response as-is
    return response;
  }
}

/**
 * Create a context object with correlation ID
 * PERFORMANCE: Cached to avoid repeated correlation ID retrieval
 */
export const createTraceContext = cache(async (additionalContext: Record<string, any> = {}): Promise<{
  traceId: string;
  [key: string]: any;
}> => {
  const traceId = await getCorrelationId();
  return {
    traceId,
    ...additionalContext,
  };
});

