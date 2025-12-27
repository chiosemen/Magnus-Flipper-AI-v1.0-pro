import Fastify from 'fastify';
import { getConfig } from './lib/config.js';
import { verifyGuardianKey } from './lib/auth.js';
import { registerHealthRoute } from './routes/health.js';
import { registerLatestRoute } from './routes/latest.js';
import { registerIngestionRoutes } from './routes/ingestion.js';
import { registerInvariantsRoutes } from './routes/invariants.js';
import { registerCanaryRoutes } from './routes/canary.js';
import { registerAlertsRoute } from './routes/alerts.js';

export async function buildServer() {
  const config = getConfig();
  const server = Fastify({ logger: true });

  server.addHook('preHandler', verifyGuardianKey(config.apiKey));

  server.log.info(
    {
      guardianEnabled: config.guardianEnabled,
      invariantsEnabled: config.invariantsEnabled,
      canaryEnabled: config.canaryEnabled,
      persistenceEnabled: config.persistenceEnabled,
      persistenceMode: config.persistenceMode,
    },
    '[guardian-api] startup flags'
  );

  await registerHealthRoute(server, config);
  await registerLatestRoute(server, config);
  await registerIngestionRoutes(server, config);
  await registerInvariantsRoutes(server, config);
  await registerCanaryRoutes(server, config);
  await registerAlertsRoute(server, config);

  return { server, config };
}
