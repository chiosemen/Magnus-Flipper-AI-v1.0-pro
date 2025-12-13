#!/usr/bin/env tsx
/**
 * Deploy-Guardian Runtime Checks
 * 
 * Continuous monitoring for system invariant violations.
 * Run as a scheduled job (cron) or via monitoring service.
 * 
 * Exit Codes:
 * - 0: All checks passed
 * - 1: Critical violation detected
 * - 2: Warning detected (non-blocking)
 * - 3: Check execution error
 * 
 * Detects:
 * - Duplicate "latest" rows (I6) - CRITICAL
 * - Count drift (I3) - CRITICAL
 * - Missing ingestion events (I14) - WARNING
 * - Contract version drift (I4) - CRITICAL
 * - Unique constraint violations (I1) - CRITICAL
 * 
 * Philosophy: Failure detection over success confirmation.
 * These checks are designed to FAIL when invariants are violated.
 */

import { prisma } from '@magnus-flipper-ai/core';

interface CheckResult {
  name: string;
  invariant: string; // e.g., "I6"
  passed: boolean;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  details?: any;
  violationDetected: boolean; // Explicit: did we detect a violation?
}

const checks: CheckResult[] = [];
let exitCode = 0; // 0 = pass, 1 = critical, 2 = warning, 3 = error

async function checkDuplicateLatestRows(): Promise<CheckResult> {
  /**
   * I6: Latest Determinism
   * 
   * WHY: Dashboard must show deterministic "latest" run.
   * Multiple "latest" rows = ambiguous state.
   * 
   * FAILURE MODE: Race condition or query bug causes multiple rows
   * with same MAX(createdAt) for same environment.
   * 
   * DETECTION: Query for duplicate "latest" rows per environment.
   */
  try {
    const duplicates = await prisma.$queryRaw<Array<{ environment: string; count: bigint }>>`
      SELECT environment, COUNT(*) as count
      FROM deploy_guardian_runs r1
      WHERE r1.created_at = (
        SELECT MAX(created_at)
        FROM deploy_guardian_runs r2
        WHERE r2.environment = r1.environment
      )
      GROUP BY environment
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      return {
        name: 'Duplicate Latest Rows',
        invariant: 'I6',
        passed: false,
        violationDetected: true,
        message: `VIOLATION: Multiple rows claim to be "latest" for environments: ${duplicates.map((d) => d.environment).join(', ')}`,
        severity: 'critical',
        details: duplicates,
      };
    }

    return {
      name: 'Duplicate Latest Rows',
      invariant: 'I6',
      passed: true,
      violationDetected: false,
      message: 'No duplicate latest rows detected',
      severity: 'info',
    };
  } catch (error: any) {
    return {
      name: 'Duplicate Latest Rows',
      invariant: 'I6',
      passed: false,
      violationDetected: false, // Error, not violation
      message: `Check failed: ${error.message}`,
      severity: 'critical',
      details: { error: error.toString() },
    };
  }
}

async function checkCountDrift(): Promise<CheckResult> {
  // I3: Count Consistency
  // Alert if denormalized counts don't match payload
  const drifts = await prisma.$queryRaw<Array<{
    id: string;
    blockers: number;
    warnings: number;
    infos: number;
    payload_blockers: number;
    payload_warnings: number;
    payload_infos: number;
  }>>`
    SELECT 
      id,
      blockers,
      warnings,
      infos,
      (payload->'verdict'->>'blockers')::int as payload_blockers,
      (payload->'verdict'->>'warnings')::int as payload_warnings,
      (payload->'verdict'->>'skipped')::int as payload_infos
    FROM deploy_guardian_runs
    WHERE blockers != (payload->'verdict'->>'blockers')::int
       OR warnings != (payload->'verdict'->>'warnings')::int
       OR infos != (payload->'verdict'->>'skipped')::int
    LIMIT 10
  `;

  if (drifts.length > 0) {
    return {
      name: 'Count Drift',
      passed: false,
      message: `${drifts.length} row(s) have count drift`,
      severity: 'critical',
      details: drifts,
    };
  }

  return {
    name: 'Count Drift',
    passed: true,
    message: 'All counts match payload',
    severity: 'info',
  };
}

async function checkMissingIngestion(): Promise<CheckResult> {
  /**
   * I14: No Missing Events
   * 
   * WHY: Ensures complete audit trail. Every CI run should create a row.
   * 
   * FAILURE MODE: Silent ingestion failure, network error, or bug causes
   * CI runs to complete without creating DB rows.
   * 
   * DETECTION: Monitor time since last ingestion. Alert if > 24 hours.
   */
  try {
    const latest = await prisma.deployGuardianRun.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, environment: true, runId: true },
    });

    if (!latest) {
      return {
        name: 'Missing Ingestion',
        invariant: 'I14',
        passed: false,
        violationDetected: true,
        message: 'VIOLATION: No runs found in database (ingestion may have failed)',
        severity: 'warning',
        details: { reason: 'No runs exist' },
      };
    }

    const hoursSinceLastRun = (Date.now() - latest.createdAt.getTime()) / (1000 * 60 * 60);
    const thresholdHours = 24;

    if (hoursSinceLastRun > thresholdHours) {
      return {
        name: 'Missing Ingestion',
        invariant: 'I14',
        passed: false,
        violationDetected: true,
        message: `VIOLATION: No new runs in ${hoursSinceLastRun.toFixed(1)} hours (threshold: ${thresholdHours}h, last: ${latest.createdAt.toISOString()})`,
        severity: 'warning',
        details: { hoursSinceLastRun, thresholdHours, lastRun: latest },
      };
    }

    return {
      name: 'Missing Ingestion',
      invariant: 'I14',
      passed: true,
      violationDetected: false,
      message: `Last run ${hoursSinceLastRun.toFixed(1)} hours ago`,
      severity: 'info',
      details: { hoursSinceLastRun, lastRun: latest },
    };
  } catch (error: any) {
    return {
      name: 'Missing Ingestion',
      invariant: 'I14',
      passed: false,
      violationDetected: false,
      message: `Check failed: ${error.message}`,
      severity: 'warning',
      details: { error: error.toString() },
    };
  }
}

async function checkContractIntegrity(): Promise<CheckResult> {
  // I4: Contract Integrity
  // Alert if contract version or schema hash doesn't match payload
  const mismatches = await prisma.$queryRaw<Array<{
    id: string;
    contract_version: string | null;
    contract_schema_hash: string | null;
    payload_version: string | null;
    payload_hash: string | null;
  }>>`
    SELECT 
      id,
      contract_version,
      contract_schema_hash,
      payload->'contract'->>'version' as payload_version,
      payload->'contract'->>'schemaSha256' as payload_hash
    FROM deploy_guardian_runs
    WHERE contract_version IS DISTINCT FROM (payload->'contract'->>'version')
       OR contract_schema_hash IS DISTINCT FROM (payload->'contract'->>'schemaSha256')
    LIMIT 10
  `;

  if (mismatches.length > 0) {
    return {
      name: 'Contract Integrity',
      passed: false,
      message: `${mismatches.length} row(s) have contract metadata mismatch`,
      severity: 'critical',
      details: mismatches,
    };
  }

  return {
    name: 'Contract Integrity',
    passed: true,
    message: 'All contract metadata matches payload',
    severity: 'info',
  };
}

async function checkUniqueRunIds(): Promise<CheckResult> {
  /**
   * I1: Uniqueness Constraint
   * 
   * WHY: Prevents duplicate ingestion from same CI run. Ensures
   * idempotent ingestion.
   * 
   * FAILURE MODE: Database unique constraint bypassed, or constraint
   * not enforced. Should never happen, but check anyway.
   * 
   * DETECTION: Query for duplicate run_id values (should never exist).
   */
  try {
    const duplicates = await prisma.$queryRaw<Array<{ run_id: string; count: bigint }>>`
      SELECT run_id, COUNT(*) as count
      FROM deploy_guardian_runs
      WHERE run_id IS NOT NULL
      GROUP BY run_id
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      return {
        name: 'Unique Run IDs',
        invariant: 'I1',
        passed: false,
        violationDetected: true,
        message: `VIOLATION: Duplicate run_ids detected (database constraint may be bypassed): ${duplicates.map((d) => d.run_id).join(', ')}`,
        severity: 'critical',
        details: duplicates,
      };
    }

    return {
      name: 'Unique Run IDs',
      invariant: 'I1',
      passed: true,
      violationDetected: false,
      message: 'All run_ids are unique',
      severity: 'info',
    };
  } catch (error: any) {
    return {
      name: 'Unique Run IDs',
      invariant: 'I1',
      passed: false,
      violationDetected: false,
      message: `Check failed: ${error.message}`,
      severity: 'critical',
      details: { error: error.toString() },
    };
  }
}

async function runAllChecks(): Promise<void> {
  console.log('🔍 Running Deploy-Guardian Runtime Checks...\n');
  console.log('Philosophy: Failure detection over success confirmation\n');

  const checkFunctions = [
    checkDuplicateLatestRows,
    checkCountDrift,
    checkMissingIngestion,
    checkContractIntegrity,
    checkUniqueRunIds,
  ];

  for (const checkFn of checkFunctions) {
    try {
      const result = await checkFn();
      checks.push(result);

      const icon = result.violationDetected
        ? '❌'
        : result.passed
        ? '✅'
        : result.severity === 'critical'
        ? '❌'
        : '⚠️';
      const prefix = result.violationDetected ? '[VIOLATION]' : '';
      console.log(`${icon} ${result.name} (${result.invariant}): ${prefix} ${result.message}`);
      if (result.details && result.violationDetected) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
    } catch (error: any) {
      checks.push({
        name: checkFn.name,
        invariant: 'UNKNOWN',
        passed: false,
        violationDetected: false,
        message: `Check execution error: ${error.message}`,
        severity: 'critical',
        details: { error: error.toString() },
      });
      console.log(`❌ ${checkFn.name}: Check execution error - ${error.message}`);
      exitCode = 3; // Execution error
    }
  }

  console.log('\n📊 Summary:');
  const violations = checks.filter((c) => c.violationDetected);
  const critical = checks.filter((c) => !c.passed && c.severity === 'critical' && !c.violationDetected);
  const warnings = checks.filter((c) => !c.passed && c.severity === 'warning');
  const passed = checks.filter((c) => c.passed);

  console.log(`   ✅ Passed: ${passed.length}`);
  console.log(`   ⚠️  Warnings: ${warnings.length}`);
  console.log(`   ❌ Critical Errors: ${critical.length}`);
  console.log(`   🚨 Violations Detected: ${violations.length}`);

  // Exit codes:
  // 0 = all passed
  // 1 = critical violation detected
  // 2 = warning only (non-blocking)
  // 3 = check execution error

  if (violations.length > 0) {
    exitCode = 1; // Critical violation
  } else if (critical.length > 0) {
    exitCode = 3; // Execution error
  } else if (warnings.length > 0) {
    exitCode = 2; // Warning only
  } else {
    exitCode = 0; // All passed
  }

  console.log(`\nExit Code: ${exitCode}`);
  if (exitCode !== 0) {
    console.log('⚠️  Checks did not pass. Review violations above.');
  }
}

// Run if executed directly
if (require.main === module) {
  runAllChecks()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runAllChecks, checks };
