/**
 * API Route Instrumentation Wrapper
 * Wraps API route handlers with tracing, logging, and error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCorrelationIdFromRequest, addCorrelationIdToResponse } from './correlation';
import { logInfo, logError } from './logger';
import { recordLatency, incrementCounter } from './metrics';
import { recordApiSuccess, recordApiFailure } from './slo';
import { alertOnSlowAPI } from './alerts';

type ApiHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>>; traceId?: string }
) => Promise<NextResponse | Response | any>;

interface InstrumentationOptions {
  module?: string;
  logRequest?: boolean;
  logResponse?: boolean;
}

/**
 * Instrument an API route handler with tracing and logging
 */
export function instrumentApiRoute(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>,
  options: InstrumentationOptions = {}
): (request: NextRequest, context?: any) => Promise<NextResponse> {
  const { module = 'api', logRequest = true, logResponse = true } = options;

  return async (request: NextRequest, context?: { params?: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const start = performance.now();
    const traceId = getCorrelationIdFromRequest(request);
    const method = request.method;
    const pathname = request.nextUrl.pathname;

    try {
      // Log request
      if (logRequest) {
        logInfo('API Request', {
          traceId,
          module,
          method,
          pathname,
          url: request.url,
        });
      }

      // Call handler with trace context
      const handlerContext: { params?: Promise<Record<string, string>>; traceId: string } = {
        ...context,
        traceId,
      };

      const response = await handler(request, handlerContext);

      const duration = performance.now() - start;
      const durationMs = Math.round(duration);

      // PERFORMANCE: Record metrics
      recordLatency(`api.${module}`, durationMs);
      recordApiSuccess(pathname, durationMs);
      
      // Alert on slow API
      alertOnSlowAPI(pathname, durationMs, 2000);

      // Log successful response
      if (logResponse) {
        logInfo('API Success', {
          traceId,
          module,
          method,
          pathname,
          status: response.status,
          duration: durationMs,
        });
      }

      // Add correlation ID to response headers
      // Ensure response is NextResponse
      const nextResponse = response instanceof NextResponse 
        ? response 
        : NextResponse.json(response);
      return addCorrelationIdToResponse(nextResponse, traceId);
    } catch (error) {
      const duration = performance.now() - start;
      const durationMs = Math.round(duration);

      // PERFORMANCE: Record failure metrics
      recordLatency(`api.${module}`, durationMs);
      recordApiFailure(pathname, durationMs);
      incrementCounter(`api.${module}.error`);

      // Log error with severity and category
      logError('API Error', {
        traceId,
        module,
        method,
        pathname,
        duration: durationMs,
        error: error instanceof Error ? error : String(error),
      }, 'high', 'api');

      // Return error response
      return NextResponse.json(
        {
          error: 'Internal server error',
          traceId,
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Create a GET handler with instrumentation
 */
export function createGetHandler(
  handler: (request: NextRequest, context: { traceId: string; params?: Promise<Record<string, string>> }) => Promise<NextResponse>,
  options?: InstrumentationOptions
) {
  return instrumentApiRoute(async (request, context) => {
    return handler(request, context as { traceId: string; params?: Promise<Record<string, string>> });
  }, options);
}

/**
 * Create a POST handler with instrumentation
 */
export function createPostHandler(
  handler: (request: NextRequest, context: { traceId: string; params?: Promise<Record<string, string>> }) => Promise<NextResponse>,
  options?: InstrumentationOptions
) {
  return instrumentApiRoute(async (request, context) => {
    return handler(request, context as { traceId: string; params?: Promise<Record<string, string>> });
  }, options);
}

