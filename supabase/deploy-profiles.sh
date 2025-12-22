#!/bin/bash

# ============================================================================
# Supabase Production Database Fix: Create Profiles Table
# ============================================================================
# This script deploys the profiles table migration and admin seed to production
# Run this script AFTER setting up your Supabase CLI credentials
# ============================================================================

set -e  # Exit on any error

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║          Supabase Production Database Fix: Profiles Table           ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    echo ""
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Login first:"
    echo "   supabase login"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI ready"
echo ""

# Confirm production deployment
read -p "⚠️  Deploy to PRODUCTION database? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Deploy profiles table migration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Link to your Supabase project (replace with your project ref)
read -p "Enter your Supabase project ref (from dashboard URL): " project_ref
supabase link --project-ref "$project_ref"

echo ""
echo "Running migration: 20251222_create_profiles_table.sql"
echo ""

# Run the migration
supabase db push

echo ""
echo "✅ Migration deployed successfully"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Seed admin user"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Promote chinye.osemene@icloud.com to admin? (yes/no): " seed_confirm
if [ "$seed_confirm" == "yes" ]; then
    echo "Running seed: 20251222_promote_admin.sql"
    echo ""

    # Execute seed SQL directly via Supabase CLI
    supabase db execute --file supabase/seeds/20251222_promote_admin.sql

    echo ""
    echo "✅ Admin user promoted successfully"
else
    echo "⏭️  Skipping admin seed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Verify deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verify profiles table exists
echo "Checking if profiles table exists..."
supabase db execute --sql "SELECT COUNT(*) FROM public.profiles;"

echo ""
echo "Checking if admin user exists..."
supabase db execute --sql "SELECT id, email, role, is_admin FROM public.profiles WHERE is_admin = true;"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    ✅ DEPLOYMENT COMPLETE                             ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Test login at your app URL"
echo "2. Verify admin access to /admin/dashboard"
echo "3. Check that new signups auto-create profiles"
echo ""
