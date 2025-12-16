'use client';

/**
 * GLOBAL ERROR BOUNDARY — SSR SAFE (Gold Standard)
 *
 * ⚠️ ABSOLUTE RULES:
 * - NO hooks (useContext, useState, etc.)
 * - NO client components
 * - NO providers
 * - NO UI libraries
 * - NO icons
 * - NO dynamic logic
 *
 * NOTE: 'use client' is required by Next.js but this component must remain pure.
 * Do NOT add hooks or import components that use hooks.
 *
 * This file renders BEFORE providers exist.
 * Treat it as raw HTML, not a React app.
 * 
 * GUARDRAILS:
 * - ESLint will fail if hooks are added
 * - CI guard will fail build if violations detected
 * - See: ERROR_BOUNDARY_RULES.md for complete documentation
 */

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset?: () => void;
}) {
  return (
    <html lang="en">
      <head>
        <title>Application Error</title>
        <meta name="robots" content="noindex" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: "#0b0b0b",
          color: "#ffffff",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
              Something went wrong
            </h1>

            <p style={{ opacity: 0.75, maxWidth: 420 }}>
              A critical error occurred while loading the application.
              Please refresh the page or try again later.
            </p>

            {error?.digest && (
              <p
                style={{
                  marginTop: "1.25rem",
                  fontSize: "0.75rem",
                  opacity: 0.4,
                }}
              >
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
