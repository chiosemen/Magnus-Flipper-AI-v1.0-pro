'use client';

export default function GlobalError({ error, reset }) {
  // Log error to console (Sentry temporarily disabled)
  console.error('Global error:', error);
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
