'use client';

/**
 * ⚠️ ROUTE ERROR BOUNDARY - SSR-PURE TEMPLATE ⚠️
 * 
 * CRITICAL ARCHITECTURAL CONSTRAINT:
 * This component catches errors in route segments during SSR/prerender.
 * It renders BEFORE the segment layout completes and may not have provider context.
 * 
 * NOTE ON 'use client':
 * Next.js REQUIRES 'use client' for error.tsx (framework requirement).
 * However, this does NOT mean hooks are safe - providers still don't exist during SSR.
 * 
 * ❌ FORBIDDEN (WILL BREAK BUILD):
 * - ANY React hooks (useState, useEffect, useContext, useRouter, etc.)
 * - ANY imports from /components/ui/ (they use hooks internally)
 * - ANY context access (theme, auth, etc.)
 * - className with Tailwind (global CSS may not be loaded during SSR)
 * 
 * ✅ ALLOWED:
 * - Pure JSX elements
 * - Inline styles only
 * - Static content
 * - Event handlers (onClick, onMouseOver) - they run client-side only
 * 
 * LOGGING NOTE: 
 * The previous useEffect(() => logError(...)) has been REMOVED.
 * Error logging should happen at the application boundary or via server-side
 * error reporting, NOT in error boundary components during SSR.
 * 
 * GUARDRAILS: ESLint + CI checks will FAIL if hooks are added.
 * See: ERROR_BOUNDARY_RULES.md
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  // ARCHITECTURAL NOTE:
  // No hooks, no context, no side effects.
  // This must render successfully even if the entire React tree is broken.
  
  return (
    <div 
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div 
        style={{
          maxWidth: 500,
          width: '100%',
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 8,
          padding: 32,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          {/* Error icon */}
          <div 
            style={{ 
              fontSize: 64, 
              marginBottom: 16,
              lineHeight: 1,
            }}
            role="img"
            aria-label="Error"
          >
            ⚠️
          </div>
          
          {/* Error heading */}
          <h1 
            style={{ 
              fontSize: 24, 
              fontWeight: 700, 
              color: '#ededed',
              marginBottom: 8,
              marginTop: 0,
            }}
          >
            Something went wrong
          </h1>
          
          {/* Error description */}
          <p 
            style={{ 
              color: '#a0a0a0',
              marginBottom: 24,
              lineHeight: 1.5,
            }}
          >
            We encountered an unexpected error. Please try again.
          </p>
          
          {/* Development mode: Show error details */}
          {process.env.NODE_ENV === 'development' && (
            <div 
              style={{
                marginBottom: 24,
                padding: 16,
                backgroundColor: '#0a0a0a',
                borderRadius: 4,
                border: '1px solid #2a2a2a',
                textAlign: 'left',
              }}
            >
              <p 
                style={{
                  fontSize: 11,
                  color: '#ef4444',
                  fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                  wordBreak: 'break-all',
                  margin: 0,
                }}
              >
                {error.message}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div 
            style={{ 
              display: 'flex', 
              gap: 16, 
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: 8,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              type="button"
              aria-label="Try again"
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: '12px 24px',
                backgroundColor: '#2a2a2a',
                color: '#ededed',
                borderRadius: 8,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 14,
                transition: 'background-color 0.2s',
                display: 'inline-block',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#3a3a3a';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#2a2a2a';
              }}
            >
              Go home
            </a>
          </div>

          {/* Error digest (if available) */}
          {error?.digest && (
            <p 
              style={{ 
                marginTop: 24,
                fontSize: 11,
                opacity: 0.5,
                fontFamily: 'Monaco, Menlo, "Courier New", monospace',
                wordBreak: 'break-all',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

