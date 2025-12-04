'use client';

/**
 * Global Error Boundary
 * Catches errors in root layout and critical app components
 */

import { useEffect } from 'react';
import { logError } from '@/lib/observability/logger';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to observability system
    const errorContext: Record<string, any> = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      severity: 'critical',
    };
    if ('digest' in error) {
      errorContext.error.digest = (error as any).digest;
    }
    logError('Global error boundary triggered', errorContext);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-[#1a1a1a] border border-red-500/50 rounded-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🚨</div>
              <h1 className="text-2xl font-bold text-red-400 mb-2">
                Critical Error
              </h1>
              <p className="text-[#a0a0a0] mb-6">
                A critical error occurred. The application needs to be reloaded.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-4 bg-[#0a0a0a] rounded border border-[#2a2a2a] text-left">
                  <p className="text-xs text-red-400 font-mono break-all">
                    {error.message}
                  </p>
                  {error.stack && (
                    <pre className="text-xs text-[#666] mt-2 overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Reload Application
                </button>
                <a
                  href="/"
                  className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded-lg font-medium transition-colors"
                >
                  Go to Home
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

