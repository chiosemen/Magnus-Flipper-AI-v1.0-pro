import { buildServer } from './server.js';

const { server, config } = await buildServer();

try {
  await server.listen({ port: config.port, host: '0.0.0.0' });
} catch (error) {
  server.log.error(error);
  process.exit(1);
}
