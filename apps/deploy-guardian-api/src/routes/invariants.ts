import type { FastifyInstance } from 'fastify';
import {
  ErrorResponse,
  InvariantsEvaluateRequest,
  InvariantsEvaluateResponse,
} from '@magnus/deploy-guardian-contracts';
import type { GuardianConfig } from '../lib/config.js';
import { fetchLatestInvariants } from '../db/repositories/invariants.js';
import { cacheInvariants, getInvariantsFromMemory } from '../store/memory.js';

export async function registerInvariantsRoutes(
  server: FastifyInstance,
  config: GuardianConfig
) {
  server.post('/api/guardian/invariants/evaluate', async (request, reply) => {
    try {
      InvariantsEvaluateRequest.parse(request.body);

      if (!config.guardianEnabled || !config.invariantsEnabled) {
        return InvariantsEvaluateResponse.parse({ ok: false, violations: [] });
      }

      const dbResult = await fetchLatestInvariants();
      if (dbResult) {
        cacheInvariants(dbResult);
        return dbResult;
      }

      const memoryResult = getInvariantsFromMemory();
      if (memoryResult) {
        return memoryResult;
      }

      return InvariantsEvaluateResponse.parse({ ok: true, violations: [] });
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
