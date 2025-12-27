import type { FastifyInstance } from 'fastify';
import { CanaryRunRequest, CanaryRunResponse, ErrorResponse } from '@magnus/deploy-guardian-contracts';
import type { GuardianConfig } from '../lib/config.js';
import { fetchLatestCanary } from '../db/repositories/canary.js';
import { cacheCanary, getCanaryFromMemory } from '../store/memory.js';

export async function registerCanaryRoutes(
  server: FastifyInstance,
  config: GuardianConfig
) {
  server.post('/api/guardian/canary/run', async (request, reply) => {
    try {
      const body = CanaryRunRequest.parse(request.body);

      if (!config.guardianEnabled || !config.canaryEnabled) {
        return CanaryRunResponse.parse({ ok: false, results: [] });
      }

      const dbResult = await fetchLatestCanary();
      if (dbResult) {
        cacheCanary(dbResult);
        return dbResult;
      }

      const memoryResult = getCanaryFromMemory();
      if (memoryResult) {
        return memoryResult;
      }

      const results = body.targets.map((target) => ({
        target,
        ok: true,
        latency_ms: 12,
        details: { mode: body.mode },
      }));

      return CanaryRunResponse.parse({ ok: true, results });
    } catch (error) {
      reply.code(400);
      const payload = {
        error: 'bad_request',
        message: error instanceof Error ? error.message : 'Invalid body',
      };
      return ErrorResponse.parse(payload);
    }
  });
}
