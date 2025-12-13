/**
 * Deploy-Guardian Latest Endpoint Tests
 * 
 * Tests for GET /api/deploy-guardian/latest
 * Verifies I6 (Latest Determinism) and I10 (Response Contract)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { GET } from '../../../../app/api/deploy-guardian/latest/route';
import { NextRequest } from 'next/server';
import { prisma } from '@magnus-flipper-ai/core';

// Mock auth
const mockReadAuth = (authorized: boolean = true) => {
  process.env.DEPLOY_GUARDIAN_READ_TOKEN = authorized ? 'valid-token' : 'invalid-token';
};

async function createTestRun(overrides: Partial<any> = {}) {
  const basePayload = {
    contract: { version: '2.1.0', schemaSha256: 'hash' },
    tool: { runId: `test-${Date.now()}-${Math.random()}` },
    context: { mode: 'pre-deploy', environment: 'production' },
    verdict: { status: 'SAFE', blockers: 0, warnings: 0 },
    checks: [],
  };

  return await prisma.deployGuardianRun.create({
    data: {
      mode: 'pre-deploy',
      environment: 'production',
      status: 'pass',
      contractVersion: '2.1.0',
      contractSchemaHash: 'hash',
      blockers: 0,
      warnings: 0,
      infos: 0,
      payload: { ...basePayload, ...overrides } as any,
    },
  });
}

describe('GET /api/deploy-guardian/latest', () => {
  beforeEach(async () => {
    process.env.DEPLOY_GUARDIAN_READ_TOKEN = VALID_TOKEN;
    await prisma.deployGuardianRun.deleteMany({
      where: { runId: { startsWith: 'test-' } },
    });
  });

  afterEach(async () => {
    await prisma.deployGuardianRun.deleteMany({
      where: { runId: { startsWith: 'test-' } },
    });
  });

  describe('I6: Latest Determinism', () => {
    it('should return the most recent run by createdAt', async () => {
      const run1 = await createTestRun();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const run2 = await createTestRun();

      const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
        headers: { 'x-deploy-guardian-read-token': 'valid-token' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data.latest.id).toBe(run2.id);
      expect(data.latest.createdAt).toBeTruthy();
    });

    it('should filter by environment parameter', async () => {
      await createTestRun({ context: { environment: 'production' } });
      await createTestRun({ context: { environment: 'staging' } });

      const req = new NextRequest('http://localhost/api/deploy-guardian/latest?environment=staging', {
        headers: { 'x-deploy-guardian-read-token': 'valid-token' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data.latest.environment).toBe('staging');
    });

    it('should default to production environment', async () => {
      await createTestRun({ context: { environment: 'production' } });
      await createTestRun({ context: { environment: 'staging' } });

      const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
        headers: { 'x-deploy-guardian-read-token': 'valid-token' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data.latest.environment).toBe('production');
    });

    it('should return null when no runs exist', async () => {
      const req = new NextRequest('http://localhost/api/deploy-guardian/latest?environment=nonexistent', {
        headers: { 'x-deploy-guardian-read-token': 'valid-token' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data.latest).toBeNull();
    });
  });

  describe('I8: Auth Enforcement', () => {
    it('should return 401 without token', async () => {
      delete process.env.DEPLOY_GUARDIAN_READ_TOKEN;
      const req = new NextRequest('http://localhost/api/deploy-guardian/latest');

      const res = await GET(req);

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 with invalid token', async () => {
      const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
        headers: { 'x-deploy-guardian-read-token': INVALID_TOKEN },
      });

      const res = await GET(req);

      expect(res.status).toBe(401);
    });

    it('should return 200 with valid token', async () => {
      await createTestRun();
      const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
        headers: { 'x-deploy-guardian-read-token': 'valid-token' },
      });

      const res = await GET(req);

      expect(res.status).toBe(200);
    });
  });

  describe('I10: Response Contract', () => {
    it('should return { latest: Run | null } structure', async () => {
      await createTestRun();
      const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
        headers: { 'x-deploy-guardian-read-token': 'valid-token' },
      });

      const res = await GET(req);
      const data = await res.json();

      expect(data).toHaveProperty('latest');
      if (data.latest) {
        expect(data.latest).toHaveProperty('id');
        expect(data.latest).toHaveProperty('createdAt');
        expect(data.latest).toHaveProperty('status');
        expect(data.latest).toHaveProperty('environment');
        expect(data.latest).toHaveProperty('payload');
      }
    });

    it('should include all required fields', async () => {
      const run = await createTestRun();
      const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
        headers: { 'x-deploy-guardian-read-token': 'valid-token' },
      });

      const res = await GET(req);
      const data = await res.json();

      const requiredFields = [
        'id',
        'createdAt',
        'status',
        'mode',
        'environment',
        'blockers',
        'warnings',
        'infos',
        'commitSha',
        'actor',
        'workflow',
        'runId',
        'branch',
        'contractVersion',
        'contractSchemaHash',
        'payload',
      ];

      for (const field of requiredFields) {
        expect(data.latest).toHaveProperty(field);
      }
    });
  });

  describe('I7: Read-Only Safety', () => {
    it('should not mutate data', async () => {
      const run = await createTestRun();
      const originalCreatedAt = run.createdAt;

      const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
        headers: { 'x-deploy-guardian-read-token': 'valid-token' },
      });

      await GET(req);

      // Verify no mutations
      const after = await prisma.deployGuardianRun.findUnique({
        where: { id: run.id },
      });

      expect(after?.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('should not create new rows', async () => {
      const beforeCount = await prisma.deployGuardianRun.count();

      const req = new NextRequest('http://localhost/api/deploy-guardian/latest', {
        headers: { 'x-deploy-guardian-read-token': 'valid-token' },
      });

      await GET(req);

      const afterCount = await prisma.deployGuardianRun.count();
      expect(afterCount).toBe(beforeCount);
    });
  });
});
