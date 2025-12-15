/**
 * Global Error Boundary
 * Catches errors in root layout and critical app components
 * 
 * IMPORTANT: This MUST be a server component with no hooks, context, or client-side code.
 * It needs to be prerender-safe and work even when the React tree is broken.
 */

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Critical Error</title>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#0a0a0a', color: '#ededed' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ maxWidth: '28rem', width: '100%', backgroundColor: '#1a1a1a', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '0.5rem', padding: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.75rem', marginBottom: '1rem' }}>🚨</div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f87171', marginBottom: '0.5rem', marginTop: 0 }}>
                Critical Error
              </h1>
              <p style={{ color: '#a0a0a0', marginBottom: '1.5rem', marginTop: 0 }}>
                A critical error occurred. Please refresh the page or try again later.
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href="/"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    display: 'inline-block',
                  }}
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
