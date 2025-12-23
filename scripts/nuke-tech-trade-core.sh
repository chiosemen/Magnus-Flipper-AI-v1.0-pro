#!/usr/bin/env bash
set -e

echo "☢️  NUKING tech-trade-core imports from apps/web"
echo "------------------------------------------------"

TARGETS=(
  "apps/web/app/api/admin/tech-trade/ops/movers/route.ts"
  "apps/web/app/api/admin/tech-trade/ops/overview/route.ts"
  "apps/web/app/api/admin/tech-trade/ops/status/route.ts"
  "apps/web/app/api/admin/tech-trade/risk/route.ts"
  "apps/web/app/api/tech-trade/business/bulk/route.ts"
  "apps/web/app/api/tech-trade/device-search/route.ts"
  "apps/web/app/api/tech-trade/quote/route.ts"
)

for FILE in "${TARGETS[@]}"; do
  if [ -f "$FILE" ]; then
    echo "💥 Quarantining $FILE"
    cat > "$FILE" <<'EOF'
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: "disabled",
      reason: "tech-trade-core temporarily quarantined",
    },
    { status: 503 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      status: "disabled",
      reason: "tech-trade-core temporarily quarantined",
    },
    { status: 503 }
  );
}
EOF
  else
    echo "⚠️  Skipped missing file: $FILE"
  fi
done

echo ""
echo "🧹 Removing tech-trade-core dependency from web app"

pnpm --filter web remove @magnus-flipper-ai/tech-trade-core || true

echo ""
echo "✅ tech-trade-core fully quarantined."
echo "👉 You can now build and deploy safely."

