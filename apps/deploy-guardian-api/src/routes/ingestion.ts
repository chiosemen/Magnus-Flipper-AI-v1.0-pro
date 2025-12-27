import type { FastifyInstance } from 'fastify';
import { ErrorResponse, IngestionRunsResponse, Marketplace } from '@magnus/deploy-guardian-contracts';
import { z } from 'zod';
import type { GuardianConfig } from '../lib/config.js';
import { fetchIngestionRuns } from '../db/repositories/ingestion.js';
import { cacheIngestionRuns, getRunsFromMemory } from '../store/memory.js';

const querySchema = z.object({
  marketplace: Marketplace,
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

export async function registerIngestionRoutes(
  server: FastifyInstance,
  config: GuardianConfig
) {
  server.get('/api/guardian/ingestion/runs', async (request, reply) => {
    try {
      const query = querySchema.parse(request.query);
      const limit = query.limit ?? 50;

      const dbRuns = config.guardianEnabled
        ? await fetchIngestionRuns(query.marketplace, limit)
        : null;

      if (dbRuns) {
        cacheIngestionRuns(dbRuns);
        return IngestionRunsResponse.parse({ runs: dbRuns });
      }

      const memoryRuns = getRunsFromMemory()
        .filter((run) => run.marketplace === query.marketplace)
        .slice(0, limit);

      if (memoryRuns.length > 0) {
        return IngestionRunsResponse.parse({ runs: memoryRuns });
      }

      return IngestionRunsResponse.parse({ runs: [] });
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
