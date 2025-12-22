#!/usr/bin/env tsx
/**
 * Feature Flags Smoke Test
 * 
 * Verifies feature flags work across:
 * - ENV overrides
 * - DB flags
 * - Web API
 * - Worker integration
 */

import { createClient } from '@supabase/supabase-js';
import { initFeatureFlags, getFlag, printFlagStatus } from '@magnus-flipper-ai/core';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
}

const results: TestResult[] = [];

/**
 * Test 1: ENV Override
 */
async function testEnvOverride(): Promise<TestResult> {
  // Set test env var
  process.env.FEATURE_TEST_FLAG = 'true';
  
  // Initialize flags
  if (SUPABASE_URL && SUPABASE_KEY) {
    initFeatureFlags(SUPABASE_URL, SUPABASE_KEY);
    const enabled = await getFlag('TEST_FLAG');
    
    if (enabled) {
      return {
        name: 'ENV Override',
        status: 'PASS',
        message: 'ENV override works correctly',
      };
    } else {
      return {
        name: 'ENV Override',
        status: 'FAIL',
        message: 'ENV override did not work',
      };
    }
  }
  
  return {
    name: 'ENV Override',
    status: 'SKIP',
    message: 'Supabase not configured',
  };
}

/**
 * Test 2: DB Flag
 */
async function testDbFlag(): Promise<TestResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {
      name: 'DB Flag',
      status: 'SKIP',
      message: 'Supabase not configured',
    };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Check if feature_flags table exists
    const { data, error } = await supabase
      .from('feature_flags')
      .select('key, enabled')
      .eq('key', 'FEATURE_ELITE_POOL_DISPATCH')
      .single();

    if (error) {
      return {
        name: 'DB Flag',
        status: 'FAIL',
        message: `Database query failed: ${error.message}`,
      };
    }

    if (!data) {
      return {
        name: 'DB Flag',
        status: 'SKIP',
        message: 'Feature flag not found in DB (may need migration)',
      };
    }

    return {
      name: 'DB Flag',
      status: 'PASS',
      message: `Flag exists: enabled=${data.enabled}`,
    };
  } catch (error) {
    return {
      name: 'DB Flag',
      status: 'FAIL',
      message: `Error: ${String(error)}`,
    };
  }
}

/**
 * Test 3: Web API
 */
async function testWebApi(): Promise<TestResult> {
  const API_URL = process.env.API_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${API_URL}/api/flags`);
    
    if (!response.ok) {
      return {
        name: 'Web API',
        status: 'SKIP',
        message: `API returned ${response.status} (may not be running)`,
      };
    }

    const data = await response.json();
    
    if (data.flags && typeof data.flags === 'object') {
      return {
        name: 'Web API',
        status: 'PASS',
        message: `API returns flags: ${Object.keys(data.flags).length} flags`,
      };
    }

    return {
      name: 'Web API',
      status: 'FAIL',
      message: 'API response format invalid',
    };
  } catch (error) {
    return {
      name: 'Web API',
      status: 'SKIP',
      message: `Could not reach API: ${String(error)}`,
    };
  }
}

/**
 * Test 4: Worker Integration
 */
async function testWorkerIntegration(): Promise<TestResult> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {
      name: 'Worker Integration',
      status: 'SKIP',
      message: 'Supabase not configured',
    };
  }

  try {
    initFeatureFlags(SUPABASE_URL, SUPABASE_KEY);
    
    // Test getting a flag
    const enabled = await getFlag('FEATURE_ELITE_POOL_DISPATCH');
    
    return {
      name: 'Worker Integration',
      status: 'PASS',
      message: `Flag check works: FEATURE_ELITE_POOL_DISPATCH=${enabled}`,
    };
  } catch (error) {
    return {
      name: 'Worker Integration',
      status: 'FAIL',
      message: `Error: ${String(error)}`,
    };
  }
}

/**
 * Main test runner
 */
async function main() {
  console.log('🧪 Feature Flags Smoke Test\n');

  // Run tests
  results.push(await testEnvOverride());
  results.push(await testDbFlag());
  results.push(await testWebApi());
  results.push(await testWorkerIntegration());

  // Print results
  console.log('Results:\n');
  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`${icon} ${result.name}: ${result.status}`);
    console.log(`   ${result.message}\n`);
  });

  // Summary
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;

  console.log('SUMMARY:');
  console.log(`  ✅ PASS: ${passed}`);
  console.log(`  ❌ FAIL: ${failed}`);
  console.log(`  ⚠️  SKIP: ${skipped}`);
  console.log(`  Total: ${results.length}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error running smoke test:', error);
  process.exit(1);
});

