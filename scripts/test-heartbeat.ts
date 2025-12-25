#!/usr/bin/env tsx
/**
 * Test script for worker heartbeat system
 *
 * Usage:
 *   NEXT_PUBLIC_API_URL=http://localhost:3000 tsx scripts/test-heartbeat.ts
 *
 * This script simulates a worker sending heartbeats to test the full flow:
 * Worker → API → Database → Landing Page
 */

import { createHeartbeat } from '../packages/sdk/src/heartbeat.js';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const WORKER_ID = `test-worker-${Date.now()}`;

console.log('🧪 Testing Worker Heartbeat System');
console.log('=====================================');
console.log(`API URL: ${API_URL}`);
console.log(`Worker ID: ${WORKER_ID}`);
console.log('');

// Create heartbeat instance
const heartbeat = createHeartbeat({
  workerId: WORKER_ID,
  workerType: 'test-scanner',
  marketplace: 'Facebook',
  apiUrl: API_URL,
});

async function runTest() {
  try {
    console.log('1️⃣  Sending idle heartbeat...');
    await heartbeat.goIdle({ test: true });
    console.log('   ✅ Idle heartbeat sent\n');

    await sleep(2000);

    console.log('2️⃣  Starting scanning state...');
    await heartbeat.startScanning({ iteration: 1 });
    console.log('   ✅ Scanning heartbeat sent\n');

    await sleep(2000);

    console.log('3️⃣  Updating to cooldown state...');
    await heartbeat.cooldown({ reason: 'rate-limit' });
    console.log('   ✅ Cooldown heartbeat sent\n');

    await sleep(2000);

    console.log('4️⃣  Reporting error state...');
    await heartbeat.reportError(new Error('Test error'), { code: 'TEST_ERROR' });
    console.log('   ✅ Error heartbeat sent\n');

    await sleep(2000);

    console.log('5️⃣  Starting heartbeat interval (5s)...');
    heartbeat.startInterval(5000);
    console.log('   ✅ Interval started (will send heartbeats every 5s)\n');

    console.log('🔄 Running for 20 seconds...');
    console.log('   Check http://localhost:3000 to see worker status live\n');

    await sleep(20000);

    console.log('6️⃣  Shutting down gracefully...');
    await heartbeat.shutdown();
    console.log('   ✅ Shutdown heartbeat sent\n');

    console.log('✅ Test completed successfully!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Check http://localhost:3000 landing page');
    console.log('   2. Verify worker status shows in UI');
    console.log('   3. Check Supabase worker_heartbeats table');
    process.exit(0);

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   - Is the Next.js dev server running on localhost:3000?');
    console.error('   - Are SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set?');
    console.error('   - Did you run the database migration for worker_heartbeats?');
    process.exit(1);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

runTest();
