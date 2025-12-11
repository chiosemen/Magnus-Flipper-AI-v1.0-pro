#!/usr/bin/env node

/**
 * Verify migration 20260007 by checking if tables exist
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load vault to get credentials
const vaultPath = 'secrets/env.vault.local.json';
if (!fs.existsSync(vaultPath)) {
  console.error('❌ Vault file not found');
  process.exit(1);
}

const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
const prod = vault.environments.production.values;

const supabaseUrl = prod.SUPABASE_URL;
const supabaseKey = prod.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in vault');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying migration 20260007...');
  console.log(`📡 Database: ${supabaseUrl}`);
  console.log('');

  try {
    // Check if scrape_runs table exists
    const scrapeRunsCheck = await supabase
      .from('scrape_runs')
      .select('id')
      .limit(1);
    
    const marketplaceControlsCheck = await supabase
      .from('marketplace_controls')
      .select('id')
      .limit(1);

    if (scrapeRunsCheck.error && scrapeRunsCheck.error.code === '42P01') {
      console.log('❌ Table scrape_runs does NOT exist');
      return false;
    }
    
    if (marketplaceControlsCheck.error && marketplaceControlsCheck.error.code === '42P01') {
      console.log('❌ Table marketplace_controls does NOT exist');
      return false;
    }

    console.log('✅ Table scrape_runs exists');
    console.log('✅ Table marketplace_controls exists');
    console.log('');
    console.log('🎉 Migration 20260007 appears to be applied!');
    
    // Get table info
    const scrapeRunsInfo = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'scrape_runs'
        ORDER BY ordinal_position;
      `
    });

    return true;
  } catch (error) {
    console.error('❌ Error verifying migration:', error.message);
    return false;
  }
}

verifyMigration().then(success => {
  process.exit(success ? 0 : 1);
});
