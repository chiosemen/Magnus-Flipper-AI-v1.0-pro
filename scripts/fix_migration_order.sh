#!/bin/bash
set -e

echo "🔧 Fixing Supabase migration ordering…"

MIG_DIR="supabase/migrations"

# 1. Rename files to enforce dependency order
echo "📁 Renaming migration files for correct sequence…"

mv "$MIG_DIR/20251130_marketplace_listings.sql" \
   "$MIG_DIR/20251130_01_marketplace_listings.sql" 2>/dev/null || true

mv "$MIG_DIR/20251130_marketplace_analytics.sql" \
   "$MIG_DIR/20251130_02_marketplace_analytics.sql" 2>/dev/null || true

mv "$MIG_DIR/20251130_expand_marketplace_support.sql" \
   "$MIG_DIR/20251130_03_expand_marketplace_support.sql" 2>/dev/null || true

mv "$MIG_DIR/20251130_analytics_enhancements.sql" \
   "$MIG_DIR/20251130_04_analytics_enhancements.sql" 2>/dev/null || true

echo "✔ File renames complete."

# 2. Check whether price_history table definition exists
echo "🔍 Checking for price_history table…"

if ! grep -R "CREATE TABLE IF NOT EXISTS price_history" -n "$MIG_DIR"; then
  echo "❌ price_history definition missing — inserting automatically…"

  cat >> "$MIG_DIR/20251130_01_marketplace_listings.sql" <<'EOF'

-- AUTO-INSERTED: price_history table (dependency fix)
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  marketplace TEXT NOT NULL CHECK (marketplace IN ('VINTED','EBAY','GUMTREE','FB_MARKETPLACE','CRAIGSLIST','OFFERUP')),
  external_id TEXT NOT NULL,
  price NUMERIC NOT NULL,
  price_change NUMERIC,
  price_change_percent NUMERIC,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
EOF

  echo "✔ price_history table inserted."
else
  echo "✔ price_history table already present."
fi

# 3. Final instructions
echo "-------------------------------------------------------------"
echo "🚀 Migration order repaired."
echo "Next step:"
echo "  supabase db push --include-all"
echo "-------------------------------------------------------------"

