#!/usr/bin/env ts-node
/**
 * Production Test Runner
 * Orchestrates all production readiness tests
 * 
 * Usage:
 *   pnpm test:production
 *   pnpm test:production --smoke
 *   pnpm test:production --contracts
 *   pnpm test:production --workers
 *   pnpm test:production --feed
 *   pnpm test:production --chaos
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const exec = promisify(require('child_process').exec);

interface TestSuite {
  name: string;
  file: string;
  description: string;
}

const testSuites: TestSuite[] = [
  {
    name: 'smoke',
    file: 'smoke.test.ts',
    description: 'Comprehensive smoke tests for all system components',
  },
  {
    name: 'contracts',
    file: 'api-contracts.test.ts',
    description: 'API contract validation tests',
  },
  {
    name: 'workers',
    file: 'worker-simulation.test.ts',
    description: 'Worker behavior simulation tests',
  },
  {
    name: 'feed',
    file: 'feed-correctness.test.ts',
    description: 'Feed engine correctness tests',
  },
  {
    name: 'chaos',
    file: 'chaos.test.ts',
    description: 'Chaos engineering resilience tests',
  },
];

async function runTestSuite(suite: TestSuite): Promise<{ passed: boolean; output: string }> {
  const testPath = path.join(__dirname, suite.file);
  console.log(`\n🧪 Running ${suite.name} tests...`);
  console.log(`   ${suite.description}`);

  return new Promise((resolve) => {
    const jest = spawn('npx', ['jest', testPath, '--verbose'], {
      cwd: path.join(__dirname, '..', '..'),
      stdio: 'pipe',
      shell: true,
    });

    let output = '';
    let errorOutput = '';

    jest.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    jest.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text);
    });

    jest.on('close', (code) => {
      const passed = code === 0;
      resolve({ passed, output: output + errorOutput });
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const runAll = args.length === 0;
  const suitesToRun = runAll
    ? testSuites
    : testSuites.filter((suite) => args.includes(`--${suite.name}`));

  if (suitesToRun.length === 0) {
    console.error('❌ No test suites specified');
    console.log('\nAvailable suites:');
    testSuites.forEach((suite) => {
      console.log(`  --${suite.name}: ${suite.description}`);
    });
    process.exit(1);
  }

  console.log('🚀 Production Readiness Test Suite');
  console.log('=====================================\n');

  const results: Array<{ suite: TestSuite; passed: boolean }> = [];

  for (const suite of suitesToRun) {
    const result = await runTestSuite(suite);
    results.push({ suite, passed: result.passed });

    if (!result.passed) {
      console.error(`\n❌ ${suite.name} tests failed`);
    } else {
      console.log(`\n✅ ${suite.name} tests passed`);
    }
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('=====================================');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.suite.name}`);
  });

  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review output above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
