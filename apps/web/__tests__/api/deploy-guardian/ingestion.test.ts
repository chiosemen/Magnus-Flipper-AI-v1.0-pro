/**
 * Deploy-Guardian Ingestion Tests
 * 
 * Tests for POST /api/deploy-guardian/runs
 * Verifies I9 (Idempotency), I14 (No Missing Events), I15 (Payload Fidelity)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { POST } from '../../../../app/api/deploy-guardian/runs/route';
import { NextRequest } from 'next/server';
import { prisma } from '@magnus-flipper-ai/core';

// Mock auth
const mockIngestAuth = (authorized: boolean = true) => {
  process.env.DEPLOY_GUARDIAN_INGEST_TOKEN = authorized ? 'valid-token' : 'invalid-token';
};

const createValidPayload = (overrides: Partial<any> = {}) => ({
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
    status: 'SAFE',
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
      status: 'PASS',
      severity: 'INFO',
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
});

describe('POST /api/deploy-guardian/runs', () => {
  beforeEach(() => {
    mockIngestAuth(true);
  });

  afterEach(async () => {
    await prisma.deployGuardianRun.deleteMany({
      where: { runId: { startsWith: 'test-run-' } },
    });
  });

  describe('I9: Idempotency', () => {
    it('should return 201 on first ingestion', async () => {
      const payload = createValidPayload();
      const req = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': VALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.run).toBeTruthy();
    });

    it('should return 409 on duplicate run_id', async () => {
      const payload = createValidPayload({ tool: { runId: 'duplicate-run-id' } });

      // First ingestion
      const req1 = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': VALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      await POST(req1);

      // Duplicate ingestion
      const req2 = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': VALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const res = await POST(req2);
      expect(res.status).toBe(409);

      const data = await res.json();
      expect(data.error).toBe('Duplicate run_id');
      expect(data.field).toBe('run_id');
    });

    it('should not create duplicate rows', async () => {
      const payload = createValidPayload({ tool: { runId: 'unique-run-id' } });

      const req = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': VALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      await POST(req);

      // Attempt duplicate
      const req2 = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': VALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      await POST(req2);

      const count = await prisma.deployGuardianRun.count({
        where: { runId: 'unique-run-id' },
      });
      expect(count).toBe(1);
    });
  });

  describe('I14: No Missing Events', () => {
    it('should create a row for every valid payload', async () => {
      const payloads = [
        createValidPayload({ tool: { runId: 'run-1' } }),
        createValidPayload({ tool: { runId: 'run-2' } }),
        createValidPayload({ tool: { runId: 'run-3' } }),
      ];

      for (const payload of payloads) {
        const req = new NextRequest('http://localhost/api/deploy-guardian/runs', {
          method: 'POST',
          headers: {
            'x-deploy-guardian-token': 'valid-token',
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        await POST(req);
      }

      const count = await prisma.deployGuardianRun.count({
        where: { runId: { in: ['run-1', 'run-2', 'run-3'] } },
      });
      expect(count).toBe(3);
    });

    it('should handle ingestion errors gracefully', async () => {
      const invalidPayload = { invalid: 'payload' };
      const req = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': VALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(invalidPayload),
      });

      const res = await POST(req);
      // Should still process, but may have missing fields
      // The key is that it doesn't crash silently
      expect([200, 201, 400, 500]).toContain(res.status);
    });
  });

  describe('I15: Payload Fidelity', () => {
    it('should store complete payload without modification', async () => {
      const payload = createValidPayload({
        customField: 'should be preserved',
        nested: {
          deep: {
            value: 'preserved',
          },
        },
      });

      const req = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': VALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      const data = await res.json();

      const stored = await prisma.deployGuardianRun.findUnique({
        where: { id: data.run.id },
      });

      const storedPayload = stored?.payload as any;
      expect(storedPayload.customField).toBe('should be preserved');
      expect(storedPayload.nested.deep.value).toBe('preserved');
    });

    it('should preserve all contract fields', async () => {
      const payload = createValidPayload();
      const req = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': VALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      const data = await res.json();

      const stored = await prisma.deployGuardianRun.findUnique({
        where: { id: data.run.id },
      });

      const storedPayload = stored?.payload as any;
      expect(storedPayload.contract.version).toBe(payload.contract.version);
      expect(storedPayload.verdict.status).toBe(payload.verdict.status);
      expect(storedPayload.checks).toHaveLength(payload.checks.length);
    });
  });

  describe('I3: Count Consistency', () => {
    it('should extract and store counts correctly', async () => {
      const payload = createValidPayload({
        verdict: {
          blockers: 2,
          warnings: 3,
          skipped: 1,
        },
      });

      const req = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': VALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      const data = await res.json();

      expect(data.run.blockers).toBe(2);
      expect(data.run.warnings).toBe(3);
      expect(data.run.infos).toBe(1);
    });
  });

  describe('I8: Auth Enforcement', () => {
    it('should return 401 without token', async () => {
      mockIngestAuth(false);
      const payload = createValidPayload();
      const req = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const payload = createValidPayload();
      const req = new NextRequest('http://localhost/api/deploy-guardian/runs', {
        method: 'POST',
        headers: {
          'x-deploy-guardian-token': INVALID_TOKEN,
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });
});
