import type { FastifyInstance } from 'fastify';
import { AlertsResponse, ErrorResponse } from '@magnus/deploy-guardian-contracts';
import { z } from 'zod';
import type { GuardianConfig } from '../lib/config.js';
import { fetchAlerts } from '../db/repositories/alerts.js';
import { cacheAlerts, getAlertsFromMemory } from '../store/memory.js';

const querySchema = z.object({
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

export async function registerAlertsRoute(
  server: FastifyInstance,
  config: GuardianConfig
) {
  server.get('/api/guardian/alerts', async (request, reply) => {
    try {
      const query = querySchema.parse(request.query);

      if (!config.guardianEnabled) {
        return AlertsResponse.parse({ alerts: [] });
      }

      const dbAlerts = await fetchAlerts(query.since, query.limit ?? 100);
      if (dbAlerts) {
        cacheAlerts(dbAlerts);
        return dbAlerts;
      }

      return getAlertsFromMemory();
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
