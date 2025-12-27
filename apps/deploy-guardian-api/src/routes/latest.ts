import type { FastifyInstance } from 'fastify';
import { ErrorResponse, LatestResponse, Marketplace } from '@magnus/deploy-guardian-contracts';
import { z } from 'zod';
import type { GuardianConfig } from '../lib/config.js';
import { fetchLatestSnapshot } from '../db/repositories/ingestion.js';
import { cacheLatest, getLatestFromMemory } from '../store/memory.js';

const querySchema = z.object({
  marketplace: Marketplace,
});

export async function registerLatestRoute(
  server: FastifyInstance,
  config: GuardianConfig
) {
  server.get('/api/guardian/latest', async (request, reply) => {
    try {
      const query = querySchema.parse(request.query);
      const now = new Date().toISOString();

      const dbLatest = config.guardianEnabled
        ? await fetchLatestSnapshot(query.marketplace)
        : null;

      if (dbLatest) {
        cacheLatest(dbLatest);
        return dbLatest;
      }

      const memoryLatest = getLatestFromMemory(query.marketplace);
      if (memoryLatest) {
        return memoryLatest;
      }

      return LatestResponse.parse({
        marketplace: query.marketplace,
        last_run_at: now,
        last_ok_at: null,
        last_error: null,
        lag_seconds: 0,
      });
    } catch (error) {
      reply.code(400);
      const payload = {
        error: 'bad_request',
        message: error instanceof Error ? error.message : 'Invalid query',
      };
      return ErrorResponse.parse(payload);
    }
  });
}
