import type { FastifyInstance } from 'fastify';
import { HealthResponse } from '@magnus/deploy-guardian-contracts';
import type { GuardianConfig } from '../lib/config.js';

export async function registerHealthRoute(
  server: FastifyInstance,
  config: GuardianConfig
) {
  server.get('/api/guardian/health', async () => {
    const payload = {
      status: config.guardianEnabled ? 'ok' : 'degraded',
      version: config.version,
      uptime_seconds: process.uptime(),
      checks: {
        self: { ok: true, latency_ms: 1 },
        persistence: { ok: true, message: config.persistenceMode },
      },
    };

    return HealthResponse.parse(payload);
  });
}
