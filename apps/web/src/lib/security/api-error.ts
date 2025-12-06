/**
 * Safe API Error Handler
 * Ensures no sensitive information leaks in API responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/observability/logger';
import { getCorrelationIdFromRequest } from '@/lib/observability/correlation';
import { applySecurityHeaders } from './headers';

function isDevelopment() {
  return process.env.NODE_ENV === 'development';
}

/**
 * Safe error response
 * Never exposes stack traces or internal errors in production
 */
export function createSafeErrorResponse(
  error: unknown,
  request: Request,
  statusCode: number = 500
): NextResponse {
  const traceId = getCorrelationIdFromRequest(request as any);
  
  // Log the full error internally
  logError('API Error', {
    traceId,
    error: error instanceof Error ? error : String(error),
    url: (request as any).url || 'unknown',
  });
  
  // In development, show more details
  if (isDevelopment()) {
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        traceId,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: statusCode }
    );
  }
  
  // In production, only show generic error
  const response = NextResponse.json(
    {
      error: 'Internal Server Error',
      traceId,
    },
    { status: statusCode }
  );
  
  return applySecurityHeaders(response);
}

/**
 * Wrap an API handler with safe error handling
 */
export function safeApi<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      const result = await handler(...args);
      
      // Apply security headers to successful responses too
      if (result instanceof Response) {
        return applySecurityHeaders(result);
      }
      
      return result;
    } catch (error) {
      // Extract request from args (usually first argument)
      const request = args[0] as Request;
      return createSafeErrorResponse(error, request);
    }
  }) as T;
}

/**
 * Safe API route wrapper (for Next.js route handlers)
 */
export function safeApiRoute(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
): (request: NextRequest, context?: any) => Promise<NextResponse> {
  return async (request: NextRequest, context?: any) => {
    try {
      const response = await handler(request, context);
      return applySecurityHeaders(response);
    } catch (error) {
      return createSafeErrorResponse(error, request);
    }
  };
}

