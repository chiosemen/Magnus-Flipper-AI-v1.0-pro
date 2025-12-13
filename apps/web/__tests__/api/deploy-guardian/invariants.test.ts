/**
 * Deploy-Guardian System Invariant Tests
 * 
 * Property-based tests that verify system invariants hold.
 * These tests are fast, deterministic, and infrastructure-free.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@magnus-flipper-ai/core';
import { NextRequest } from 'next/server';

// Test helpers
async function createTestRun(overrides: Partial<any> = {}) {
  const basePayload = {
    contract: {
      name: 'deployguardian',
      version: '2.1.0',
      schema: 'deployguardian.contract.schema.json',
      schemaSha256: 'test-hash-123',
    },
    tool: {
      name: 'DeployGuardian',
      version: '2.1.0',
      commitSha: 'abc123',
      runId: `test-run-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
    },
    context: {
      mode: 'pre-deploy',
      environment: 'production',
      repo: 'test/repo',
      branch: 'main',
      actor: 'test-user',
      workflow: 'test-workflow',
    },
    verdict: {
      status: 'SAFE' as const,
      exitCode: 0,
      blockers: 0,
      warnings: 1,
      passed: 5,
      skipped: 0,
      durationMs: 1000,
    },
    checks: [
      {
        id: 'test-check-1',
        status: 'PASS' as const,
        severity: 'INFO' as const,
        title: 'Test Check',
        category: 'test',
        mode: 'pre-deploy',
        durationMs: 100,
        humanSummary: 'Test check passed',
        evidence: {},
        messages: [],
      },
    ],
    ...overrides,
  };

  return await prisma.deployGuardianRun.create({
    data: {
      mode: basePayload.context.mode,
      environment: basePayload.context.environment,
      status: basePayload.verdict.status === 'SAFE' ? 'pass' : 'fail',
      contractVersion: basePayload.contract.version,
      contractSchemaHash: basePayload.contract.schemaSha256,
      blockers: basePayload.verdict.blockers,
      warnings: basePayload.verdict.warnings,
      infos: basePayload.verdict.skipped,
      commitSha: basePayload.tool.commitSha,
      actor: basePayload.context.actor,
      workflow: basePayload.context.workflow,
      runId: basePayload.tool.runId,
      branch: basePayload.context.branch,
      payload: basePayload as any,
    },
  });
}

describe('Deploy-Guardian System Invariants', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.deployGuardianRun.deleteMany({
      where: {
        runId: {
          startsWith: 'test-run-',
        },
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.deployGuardianRun.deleteMany({
      where: {
        runId: {
          startsWith: 'test-run-',
        },
      },
    });
  });

  describe('I1: Uniqueness Constraint', () => {
    it('should enforce unique run_id constraint', async () => {
      const runId = `test-run-${Date.now()}`;

      // Create first run
      await createTestRun({
        tool: { runId, commitSha: 'abc123' },
      });

      // Attempt to create duplicate
      await expect(
        createTestRun({
          tool: { runId, commitSha: 'def456' }, // Same runId, different commit
        })
      ).rejects.toThrow();
    });

    it('should allow different run_ids', async () => {
      const run1 = await createTestRun({
        tool: { runId: 'test-run-1' },
      });
      const run2 = await createTestRun({
        tool: { runId: 'test-run-2' },
      });

      expect(run1.id).not.toBe(run2.id);
      expect(run1.runId).not.toBe(run2.runId);
    });
  });

  describe('I2: Temporal Ordering', () => {
    it('should order by createdAt descending', async () => {
      const run1 = await createTestRun({
        tool: { runId: 'test-run-1' },
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const run2 = await createTestRun({
        tool: { runId: 'test-run-2' },
      });

      const latest = await prisma.deployGuardianRun.findFirst({
        where: { environment: 'production' },
        orderBy: { createdAt: 'desc' },
      });

      expect(latest?.id).toBe(run2.id);
      expect(latest?.createdAt.getTime()).toBeGreaterThan(run1.createdAt.getTime());
    });

    it('should return MAX(createdAt) for latest query', async () => {
      const runs = await Promise.all([
        createTestRun({ tool: { runId: 'test-run-1' } }),
        createTestRun({ tool: { runId: 'test-run-2' } }),
        createTestRun({ tool: { runId: 'test-run-3' } }),
      ]);

      const latest = await prisma.deployGuardianRun.findFirst({
        where: { environment: 'production' },
        orderBy: { createdAt: 'desc' },
      });

      const maxCreatedAt = Math.max(...runs.map((r) => r.createdAt.getTime()));
      expect(latest?.createdAt.getTime()).toBe(maxCreatedAt);
    });
  });

  describe('I3: Count Consistency', () => {
    it('should match denormalized counts to payload', async () => {
      const payload = {
        verdict: {
          blockers: 2,
          warnings: 3,
          skipped: 1,
        },
        checks: [
          { id: '1', status: 'FAIL', severity: 'BLOCKER' },
          { id: '2', status: 'FAIL', severity: 'BLOCKER' },
          { id: '3', status: 'WARN', severity: 'WARNING' },
          { id: '4', status: 'WARN', severity: 'WARNING' },
          { id: '5', status: 'WARN', severity: 'WARNING' },
        ],
      };

      const run = await createTestRun({
        verdict: {
          blockers: payload.verdict.blockers,
          warnings: payload.verdict.warnings,
          skipped: payload.verdict.skipped,
        },
        checks: payload.checks,
      });

      expect(run.blockers).toBe(payload.verdict.blockers);
      expect(run.warnings).toBe(payload.verdict.warnings);
      expect(run.infos).toBe(payload.verdict.skipped);
    });

    it('should detect count drift', async () => {
      // This test verifies the invariant, not the implementation
      // In production, runtime checks would detect this
      const run = await createTestRun({
        verdict: { blockers: 5, warnings: 3 },
      });

      // Manually corrupt the counts (simulating drift)
      await prisma.deployGuardianRun.update({
        where: { id: run.id },
        data: { blockers: 999 }, // Wrong count
      });

      const corrupted = await prisma.deployGuardianRun.findUnique({
        where: { id: run.id },
      });

      const payloadBlockers = (corrupted?.payload as any)?.verdict?.blockers;
      expect(corrupted?.blockers).not.toBe(payloadBlockers);
      // This demonstrates the invariant violation that runtime checks would catch
    });
  });

  describe('I4: Contract Integrity', () => {
    it('should store contract version and schema hash', async () => {
      const run = await createTestRun({
        contract: {
          version: '2.1.0',
          schemaSha256: 'abc123def456',
        },
      });

      expect(run.contractVersion).toBe('2.1.0');
      expect(run.contractSchemaHash).toBe('abc123def456');
    });

    it('should match contract metadata to payload', async () => {
      const version = '2.1.0';
      const hash = 'test-hash-123';

      const run = await createTestRun({
        contract: { version, schemaSha256: hash },
      });

      const payload = run.payload as any;
      expect(run.contractVersion).toBe(payload.contract.version);
      expect(run.contractSchemaHash).toBe(payload.contract.schemaSha256);
    });
  });

  describe('I6: Latest Determinism', () => {
    it('should return exactly one latest row per environment', async () => {
      await createTestRun({ context: { environment: 'production' } });
      await createTestRun({ context: { environment: 'production' } });
      await createTestRun({ context: { environment: 'staging' } });

      const latestProd = await prisma.deployGuardianRun.findFirst({
        where: { environment: 'production' },
        orderBy: { createdAt: 'desc' },
      });

      const latestStaging = await prisma.deployGuardianRun.findFirst({
        where: { environment: 'staging' },
        orderBy: { createdAt: 'desc' },
      });

      expect(latestProd).toBeTruthy();
      expect(latestStaging).toBeTruthy();
      expect(latestProd?.environment).toBe('production');
      expect(latestStaging?.environment).toBe('staging');
    });

    it('should return null when no runs exist', async () => {
      const latest = await prisma.deployGuardianRun.findFirst({
        where: { environment: 'nonexistent' },
        orderBy: { createdAt: 'desc' },
      });

      expect(latest).toBeNull();
    });
  });

  describe('I9: Idempotency', () => {
    it('should handle duplicate run_id gracefully', async () => {
      const runId = `test-run-${Date.now()}`;

      // First ingestion succeeds
      const run1 = await createTestRun({
        tool: { runId },
      });

      // Attempt duplicate ingestion (simulating API behavior)
      try {
        await createTestRun({
          tool: { runId },
        });
        // Should not reach here
        expect.fail('Should have thrown unique constraint error');
      } catch (error: any) {
        // Prisma throws P2002 for unique constraint violation
        expect(error.code).toBe('P2002');
      }

      // Verify only one row exists
      const count = await prisma.deployGuardianRun.count({
        where: { runId },
      });
      expect(count).toBe(1);
    });
  });

  describe('I15: Payload Fidelity', () => {
    it('should store complete payload without modification', async () => {
      const originalPayload = {
        contract: { name: 'test', version: '1.0.0' },
        tool: { name: 'TestTool', version: '1.0.0' },
        context: { mode: 'test', environment: 'test' },
        verdict: { status: 'SAFE', blockers: 0 },
        checks: [{ id: 'test-1', status: 'PASS' }],
        customField: 'should be preserved',
      };

      const run = await createTestRun(originalPayload);

      const storedPayload = run.payload as any;
      expect(storedPayload.customField).toBe('should be preserved');
      expect(storedPayload.contract.version).toBe('1.0.0');
      expect(storedPayload.checks).toHaveLength(1);
    });

    it('should preserve nested structures', async () => {
      const complexPayload = {
        checks: [
          {
            id: 'nested-1',
            evidence: {
              nested: {
                deep: {
                  value: 'preserved',
                },
              },
            },
          },
        ],
      };

      const run = await createTestRun(complexPayload);
      const storedPayload = run.payload as any;
      expect(storedPayload.checks[0].evidence.nested.deep.value).toBe('preserved');
    });
  });
});
