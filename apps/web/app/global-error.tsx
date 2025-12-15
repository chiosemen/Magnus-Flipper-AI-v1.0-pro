'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: 'system-ui', padding: 40 }}>
        <h1>Something went wrong</h1>
        <p>An unexpected error occurred.</p>

        <button
          onClick={() => reset()}
          style={{
            marginTop: 20,
            padding: '8px 14px',
            borderRadius: 6,
            border: '1px solid #ccc',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>

        <p style={{ marginTop: 20, fontSize: 12, opacity: 0.6 }}>
          Error ID: {error?.digest}
        </p>
      </body>
    </html>
  );
}
