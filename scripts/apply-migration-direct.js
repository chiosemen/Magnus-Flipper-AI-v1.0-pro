#!/usr/bin/env node

/**
 * Direct migration application script
 * Applies a SQL migration file directly to the database
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MIGRATION_FILE = process.argv[2] || 'supabase/migrations/20260007_00_marketplace_controls_and_scrape_runs.sql';
const DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!DB_URL) {
  console.error('❌ SUPABASE_DB_URL or DATABASE_URL must be set');
  process.exit(1);
}

if (!fs.existsSync(MIGRATION_FILE)) {
  console.error(`❌ Migration file not found: ${MIGRATION_FILE}`);
  process.exit(1);
}

console.log('🚀 Applying migration directly...');
console.log(`📄 File: ${MIGRATION_FILE}`);
console.log(`🗄️  Database: ${DB_URL.replace(/:[^:@]+@/, ':••••••••@')}`);
console.log('');

try {
  // Read the SQL file
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  
  // Try using Supabase CLI with newer syntax
  // First, try supabase db execute (if available)
  try {
    const result = execSync(
      `echo "${sql.replace(/"/g, '\\"')}" | supabase db execute --db-url "${DB_URL}"`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    console.log('✅ Migration applied via Supabase CLI');
    console.log(result);
  } catch (err) {
    // If that fails, try alternative method
    console.log('⚠️  Supabase CLI method failed, trying alternative...');
    throw err;
  }
} catch (error) {
  console.error('❌ Error applying migration:', error.message);
  console.log('');
  console.log('💡 Alternative: Apply migration manually via Supabase Dashboard SQL Editor');
  console.log(`   File: ${path.resolve(MIGRATION_FILE)}`);
  process.exit(1);
}
