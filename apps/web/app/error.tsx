'use client';

/**
 * Error Boundary for Route Segments
 * Catches errors in route segments and displays fallback UI
 */

import { useEffect } from 'react';
import { logError } from '@/lib/observability/logger';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to observability system
    const errorContext: Record<string, any> = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    };
    if ('digest' in error) {
      errorContext.error.digest = (error as any).digest;
    }
    logError('Route error boundary triggered', errorContext);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-[#ededed] mb-2">
            Something went wrong
          </h1>
          <p className="text-[#a0a0a0] mb-6">
            We encountered an unexpected error. Please try again.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-[#0a0a0a] rounded border border-[#2a2a2a] text-left">
              <p className="text-xs text-red-400 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-lg font-medium transition-colors"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

