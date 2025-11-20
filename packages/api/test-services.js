#!/usr/bin/env node
/**
 * Service Connectivity Test Script
 * Tests Redis, Supabase, and Stripe connectivity
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { default: Stripe } = require('stripe');
const Redis = require('ioredis');

const results = {
  redis: { status: 'pending', details: null, error: null },
  supabase: { status: 'pending', details: null, error: null },
  stripe: { status: 'pending', details: null, error: null },
};

// Test Redis
async function testRedis() {
  console.log('\n🔴 Testing Redis Connection...');
  try {
    const redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 50, 2000);
      },
    });

    // Test connection
    await redis.ping();
    console.log('✅ Redis PING successful');

    // Test write
    await redis.set('test_key', 'test_value', 'EX', 60);
    console.log('✅ Redis SET successful');

    // Test read
    const value = await redis.get('test_key');
    console.log(`✅ Redis GET successful: ${value}`);

    // Cleanup
    await redis.del('test_key');
    await redis.quit();

    results.redis.status = 'success';
    results.redis.details = 'All operations successful';
    console.log('✅ Redis: PASS\n');
  } catch (error) {
    results.redis.status = 'failed';
    results.redis.error = error.message;
    console.error(`❌ Redis: FAIL - ${error.message}\n`);
  }
}

// Test Supabase
async function testSupabase() {
  console.log('🟢 Testing Supabase Connection...');
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE
    );

    // Test connection by listing tables
    const { data, error } = await supabase.from('deals').select('count', { count: 'exact', head: true });

    if (error) throw error;

    console.log('✅ Supabase connection successful');
    console.log(`✅ Supabase 'deals' table accessible`);

    results.supabase.status = 'success';
    results.supabase.details = `Connected to ${process.env.SUPABASE_URL}`;
    console.log('✅ Supabase: PASS\n');
  } catch (error) {
    results.supabase.status = 'failed';
    results.supabase.error = error.message;
    console.error(`❌ Supabase: FAIL - ${error.message}\n`);
  }
}

// Test Stripe
async function testStripe() {
  console.log('🟡 Testing Stripe Connection...');
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Test by retrieving account info
    const account = await stripe.accounts.retrieve();

    console.log(`✅ Stripe connection successful`);
    console.log(`✅ Stripe Account ID: ${account.id}`);
    console.log(`✅ Stripe Account Type: ${account.type}`);

    results.stripe.status = 'success';
    results.stripe.details = `Account ${account.id} (${account.type})`;
    console.log('✅ Stripe: PASS\n');
  } catch (error) {
    results.stripe.status = 'failed';
    results.stripe.error = error.message;
    console.error(`❌ Stripe: FAIL - ${error.message}\n`);
  }
}

// Run all tests
async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📊 MAGNUS FLIPPER AI - SERVICE CONNECTIVITY TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  await testRedis();
  await testSupabase();
  await testStripe();

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📋 TEST SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  const passed = Object.values(results).filter(r => r.status === 'success').length;
  const total = Object.keys(results).length;

  console.log(`Redis:     ${results.redis.status === 'success' ? '✅ PASS' : '❌ FAIL'}`);
  if (results.redis.error) console.log(`           Error: ${results.redis.error}`);

  console.log(`Supabase:  ${results.supabase.status === 'success' ? '✅ PASS' : '❌ FAIL'}`);
  if (results.supabase.error) console.log(`           Error: ${results.supabase.error}`);

  console.log(`Stripe:    ${results.stripe.status === 'success' ? '✅ PASS' : '❌ FAIL'}`);
  if (results.stripe.error) console.log(`           Error: ${results.stripe.error}`);

  console.log(`\n📊 SCORE: ${passed}/${total} services accessible\n`);

  if (passed === total) {
    console.log('🎉 ALL SERVICES OPERATIONAL!\n');
    process.exit(0);
  } else {
    console.log(`⚠️  ${total - passed} service(s) failed connectivity test\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
