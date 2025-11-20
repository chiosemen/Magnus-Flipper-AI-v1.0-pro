#!/bin/bash
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS NEXT.JS + SENTRY REPAIR v1"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

WEB_DIR="web"
CONFIG="$WEB_DIR/next.config.mjs"
INSTRUMENTATION="$WEB_DIR/instrumentation.ts"
GLOBAL_ERROR="$WEB_DIR/app/global-error.js"
SENTRY_SERVER="$WEB_DIR/sentry.server.config.ts"

if [ ! -d "$WEB_DIR" ]; then
  echo "❌ web/ directory not found. Run inside repo root."
  exit 1
fi

echo "📁 Working in: $WEB_DIR"

echo "▶️ Fixing next.config.mjs — removing deprecated experimental.instrumentationHook…"

sed -i '' '/instrumentationHook/d' "$CONFIG" || true

echo "✓ next.config.mjs cleaned."

echo "▶️ Creating instrumentation.ts …"

cat > "$INSTRUMENTATION" << 'EOF'
import * as Sentry from "@sentry/nextjs";

export async function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
  });
}
EOF

echo "✓ instrumentation.ts created."

echo "▶️ Creating global-error.js …"

mkdir -p "$WEB_DIR/app"

cat > "$GLOBAL_ERROR" << 'EOF'
'use client';
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }) {
  Sentry.captureException(error);
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
EOF

echo "✓ global-error.js created."

echo "▶️ Removing deprecated sentry.server.config.ts …"
if [ -f "$SENTRY_SERVER" ]; then
  mv "$SENTRY_SERVER" "$SENTRY_SERVER.bak"
  echo "✓ Backup created: sentry.server.config.ts.bak"
else
  echo "ℹ️ No sentry.server.config.ts found — skipping"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Sentry repair complete!"
echo "   Run again: pnpm dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

