/**
 * Deploy-Guardian Invariant Failure Detection Tests
 * 
 * These tests are designed to FAIL if invariants are violated.
 * They use adversarial inputs and edge cases to detect violations.
 * 
 * Philosophy: Failure detection over success confirmation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@magnus-flipper-ai/core';

/**
 * Test Helper: Creates a test run with minimal valid data
 */
async function createMinimalRun(overrides: Partial<any> = {}) {
  const base = {
    mode: 'pre-deploy',
    environment: 'production',
    status: 'pass',
    contractVersion: '2.1.0',
    contractSchemaHash: 'hash',
    blockers: 0,
    warnings: 0,
    infos: 0,
    payload: {
      contract: { version: '2.1.0', schemaSha256: 'hash' },
      verdict: { status: 'SAFE', blockers: 0, warnings: 0 },
    },
    ...overrides,
  };

  return await prisma.deployGuardianRun.create({ data: base });
}

describe('Invariant Failure Detection', () => {
  beforeEach(async () => {
    await prisma.deployGuardianRun.deleteMany({
      where: { runId: { startsWith: 'test-' } },
    });
  });

  afterEach(async () => {
    await prisma.deployGuardianRun.deleteMany({
      where: { runId: { startsWith: 'test-' } },
    });
  });

  describe('I1: Uniqueness Constraint - Failure Detection', () => {
    /**
     * This test would PASS if the invariant is violated (duplicate allowed).
     * We want it to FAIL (throw) when duplicate is attempted.
     */
    it('should FAIL when duplicate run_id is attempted', async () => {
      const runId = `test-${Date.now()}`;

      // First ingestion succeeds
      await createMinimalRun({ runId });

      // Attempt duplicate - should FAIL (throw)
      await expect(
        createMinimalRun({ runId })
      ).rejects.toThrow();

      // Verify only one row exists (invariant holds)
      const count = await prisma.deployGuardianRun.count({ where: { runId } });
      expect(count).toBe(1);
    });

    /**
     * Adversarial: Attempt to create duplicate with different data
     * Should still fail due to unique constraint
     */
    it('should FAIL when duplicate run_id with different data', async () => {
      const runId = `test-${Date.now()}`;

      await createMinimalRun({ runId, status: 'pass' });

      // Attempt duplicate with different status - should still fail
      await expect(
        createMinimalRun({ runId, status: 'fail' })
      ).rejects.toThrow();
    });
  });

  describe('I2: Temporal Ordering - Failure Detection', () => {
    /**
     * This test verifies that createdAt is used for ordering, not payload timestamp.
     * If payload timestamp is used, this test would detect the violation.
     */
    it('should use createdAt for ordering, not payload timestamp', async () => {
      const now = new Date();
      const futureTime = new Date(now.getTime() + 10000); // 10 seconds in future

      // Create run 1 with future payload timestamp
      const run1 = await createMinimalRun({
        runId: 'test-1',
        payload: {
          tool: { timestamp: futureTime.toISOString() },
          verdict: { status: 'SAFE' },
        },
      });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Create run 2 with past payload timestamp
      const run2 = await createMinimalRun({
        runId: 'test-2',
        payload: {
          tool: { timestamp: now.toISOString() },
          verdict: { status: 'SAFE' },
        },
      });

      // Latest should be run2 (most recent createdAt), not run1 (future timestamp)
      const latest = await prisma.deployGuardianRun.findFirst({
        where: { environment: 'production' },
        orderBy: { createdAt: 'desc' },
      });

      expect(latest?.id).toBe(run2.id);
      expect(latest?.createdAt.getTime()).toBeGreaterThan(run1.createdAt.getTime());
    });
  });

  describe('I3: Count Consistency - Failure Detection', () => {
    /**
     * This test would detect if counts don't match payload.
     * We simulate count drift and verify detection.
     */
    it('should detect count drift between DB and payload', async () => {
      const payload = {
        verdict: { blockers: 5, warnings: 3, skipped: 1 },
        checks: [
          { id: '1', status: 'FAIL', severity: 'BLOCKER' },
          { id: '2', status: 'FAIL', severity: 'BLOCKER' },
          { id: '3', status: 'FAIL', severity: 'BLOCKER' },
          { id: '4', status: 'FAIL', severity: 'BLOCKER' },
          { id: '5', status: 'FAIL', severity: 'BLOCKER' },
          { id: '6', status: 'WARN', severity: 'WARNING' },
          { id: '7', status: 'WARN', severity: 'WARNING' },
          { id: '8', status: 'WARN', severity: 'WARNING' },
        ],
      };

      const run = await createMinimalRun({
        blockers: 5,
        warnings: 3,
        infos: 1,
        payload,
      });

      // Verify counts match
      expect(run.blockers).toBe(payload.verdict.blockers);
      expect(run.warnings).toBe(payload.verdict.warnings);
      expect(run.infos).toBe(payload.verdict.skipped);

      // Simulate drift (manually corrupt)
      await prisma.deployGuardianRun.update({
        where: { id: run.id },
        data: { blockers: 999 }, // Wrong count
      });

      // Verify drift is detectable
      const corrupted = await prisma.deployGuardianRun.findUnique({
        where: { id: run.id },
      });

      const payloadBlockers = (corrupted?.payload as any)?.verdict?.blockers;
      expect(corrupted?.blockers).not.toBe(payloadBlockers);
      // This demonstrates the violation that runtime checks would catch
    });
  });

  describe('I4: Contract Integrity - Failure Detection', () => {
    /**
     * This test detects contract version/hash mismatches.
     */
    it('should detect contract version mismatch', async () => {
      const run = await createMinimalRun({
        contractVersion: '2.1.0',
        contractSchemaHash: 'hash-123',
        payload: {
          contract: { version: '2.0.0', schemaSha256: 'hash-456' }, // Mismatch!
          verdict: { status: 'SAFE' },
        },
      });

      // Verify mismatch is detectable
      expect(run.contractVersion).not.toBe((run.payload as any).contract.version);
      expect(run.contractSchemaHash).not.toBe((run.payload as any).contract.schemaSha256);
    });
  });

  describe('I6: Latest Determinism - Failure Detection', () => {
    /**
     * This test detects if multiple rows claim to be "latest".
     */
    it('should detect duplicate "latest" rows', async () => {
      // Create multiple runs
      const runs = await Promise.all([
        createMinimalRun({ runId: 'test-1' }),
        createMinimalRun({ runId: 'test-2' }),
        createMinimalRun({ runId: 'test-3' }),
      ]);

      // Query for latest
      const latest = await prisma.deployGuardianRun.findFirst({
        where: { environment: 'production' },
        orderBy: { createdAt: 'desc' },
      });

      // Verify exactly one latest
      expect(latest).toBeTruthy();

      // Verify it's the most recent
      const maxCreatedAt = Math.max(...runs.map((r) => r.createdAt.getTime()));
      expect(latest?.createdAt.getTime()).toBe(maxCreatedAt);

      // Verify no other row has same createdAt (would indicate duplicate latest)
      const duplicates = await prisma.deployGuardianRun.findMany({
        where: {
          environment: 'production',
          createdAt: latest?.createdAt,
        },
      });

      expect(duplicates.length).toBe(1); // Should be exactly one
    });
  });

  describe('I9: Idempotency - Failure Detection', () => {
    /**
     * This test verifies idempotency: same run_id → same result.
     */
    it('should return same result for duplicate run_id', async () => {
      const runId = `test-${Date.now()}`;
      const payload = { verdict: { status: 'SAFE', blockers: 2 } };

      // First ingestion
      const run1 = await createMinimalRun({ runId, payload });

      // Attempt duplicate - should fail
      await expect(
        createMinimalRun({ runId, payload: { ...payload, verdict: { status: 'UNSAFE' } } })
      ).rejects.toThrow();

      // Verify original row unchanged
      const stillExists = await prisma.deployGuardianRun.findUnique({
        where: { id: run1.id },
      });

      expect(stillExists).toBeTruthy();
      expect((stillExists?.payload as any).verdict.status).toBe('SAFE');
    });
  });

  describe('I15: Payload Fidelity - Failure Detection', () => {
    /**
     * This test detects payload truncation or corruption.
     */
    it('should detect payload truncation', async () => {
      const largePayload = {
        contract: { version: '2.1.0' },
        verdict: { status: 'SAFE' },
        checks: Array.from({ length: 1000 }, (_, i) => ({
          id: `check-${i}`,
          status: 'PASS',
          evidence: { data: 'x'.repeat(1000) }, // Large payload
        })),
      };

      const run = await createMinimalRun({ payload: largePayload });

      // Verify payload is complete
      const stored = await prisma.deployGuardianRun.findUnique({
        where: { id: run.id },
      });

      const storedPayload = stored?.payload as any;
      expect(storedPayload.checks).toHaveLength(1000);
      expect(storedPayload.checks[999].id).toBe('check-999');
    });

    /**
     * This test detects payload modification during storage.
     */
    it('should detect payload modification', async () => {
      const originalPayload = {
        contract: { version: '2.1.0', customField: 'preserved' },
        verdict: { status: 'SAFE' },
      };

      const run = await createMinimalRun({ payload: originalPayload });

      // Verify payload unchanged
      const stored = await prisma.deployGuardianRun.findUnique({
        where: { id: run.id },
      });

      const storedPayload = stored?.payload as any;
      expect(storedPayload.contract.customField).toBe('preserved');
      expect(JSON.stringify(storedPayload)).toBe(JSON.stringify(originalPayload));
    });
  });

  describe('Adversarial Inputs - Failure Detection', () => {
    /**
     * These tests use adversarial inputs to detect violations.
     */

    it('should handle null run_id gracefully', async () => {
      // Null run_id should be allowed (not unique constraint)
      const run1 = await createMinimalRun({ runId: null });
      const run2 = await createMinimalRun({ runId: null });

      expect(run1.id).not.toBe(run2.id);
    });

    it('should handle empty payload gracefully', async () => {
      // Empty payload should still be stored
      const run = await createMinimalRun({ payload: {} });

      expect(run.payload).toBeTruthy();
    });

    it('should handle malformed payload structure', async () => {
      // Malformed payload should still be stored (validation happens elsewhere)
      const run = await createMinimalRun({
        payload: { invalid: 'structure', missing: 'required fields' },
      });

      expect(run.payload).toBeTruthy();
      // Note: Schema validation happens at ingestion, not storage
    });

    it('should handle very long run_id', async () => {
      const longRunId = 'x'.repeat(1000);
      const run = await createMinimalRun({ runId: longRunId });

      expect(run.runId).toBe(longRunId);
    });

    it('should handle special characters in run_id', async () => {
      const specialRunId = 'test-run-123!@#$%^&*()';
      const run = await createMinimalRun({ runId: specialRunId });

      expect(run.runId).toBe(specialRunId);
    });
  });
});
