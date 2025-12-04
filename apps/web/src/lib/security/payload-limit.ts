/**
 * API Payload Size Limits
 * Enforces maximum request body sizes
 */

import { NextRequest } from 'next/server';
import { logWarn } from '@/lib/observability/logger';

// Default size limits (in bytes)
export const PAYLOAD_LIMITS = {
  DEFAULT: 1 * 1024 * 1024, // 1MB
  WEBHOOK: 50 * 1024, // 50KB
  STRICT: 10 * 1024, // 10KB
} as const;

/**
 * Check request body size
 */
export async function checkPayloadSize(
  request: NextRequest,
  maxSize: number = PAYLOAD_LIMITS.DEFAULT
): Promise<{ valid: boolean; size?: number; error?: string }> {
  const contentLength = request.headers.get('content-length');
  
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (isNaN(size)) {
      return { valid: false, error: 'Invalid Content-Length header' };
    }
    
    if (size > maxSize) {
      logWarn('Request payload too large', {
        size,
        maxSize,
        url: request.url,
      });
      return { valid: false, size, error: `Payload exceeds maximum size of ${maxSize} bytes` };
    }
    
    return { valid: true, size };
  }
  
  // If no Content-Length, we can't check ahead of time
  // The body will be checked when reading
  return { valid: true };
}

/**
 * Read and validate request body with size limit
 */
export async function readLimitedBody(
  request: NextRequest,
  maxSize: number = PAYLOAD_LIMITS.DEFAULT
): Promise<{ body: any; error?: string }> {
  try {
    // Check Content-Length first
    const sizeCheck = await checkPayloadSize(request, maxSize);
    if (!sizeCheck.valid) {
      return { body: null, error: sizeCheck.error };
    }
    
    // Read body as text (to check size)
    const text = await request.text();
    
    if (text.length > maxSize) {
      logWarn('Request body exceeds size limit', {
        size: text.length,
        maxSize,
        url: request.url,
      });
      return { body: null, error: `Body exceeds maximum size of ${maxSize} bytes` };
    }
    
    // Parse as JSON
    try {
      const body = text ? JSON.parse(text) : null;
      return { body };
    } catch (parseError) {
      return { body: null, error: 'Invalid JSON in request body' };
    }
  } catch (error) {
    logWarn('Error reading request body', {
      error: error instanceof Error ? error.message : String(error),
      url: request.url,
    });
    return { body: null, error: 'Failed to read request body' };
  }
}

/**
 * Middleware to enforce payload size limits
 */
export function withPayloadLimit(
  maxSize: number,
  handler: (request: NextRequest, body: any) => Promise<Response>
): (request: NextRequest) => Promise<Response> {
  return async (request: NextRequest) => {
    const sizeCheck = await checkPayloadSize(request, maxSize);
    
    if (!sizeCheck.valid) {
      return new Response(
        JSON.stringify({ error: sizeCheck.error }),
        {
          status: 413, // Payload Too Large
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Read body
    const { body, error } = await readLimitedBody(request, maxSize);
    
    if (error) {
      return new Response(
        JSON.stringify({ error }),
        {
          status: 413,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    return handler(request, body);
  };
}

