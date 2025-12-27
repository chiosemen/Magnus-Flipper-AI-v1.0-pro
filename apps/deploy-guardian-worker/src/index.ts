import { getConfig } from './config.js';
import { startScheduler } from './scheduler.js';

process.on('unhandledRejection', (reason) => {
  console.error('[guardian-worker] unhandled rejection', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[guardian-worker] uncaught exception', error);
});

const config = getConfig();
console.log('[guardian-worker] startup flags', {
  guardianEnabled: config.enabled,
  invariantsEnabled: config.invariantsEnabled,
  canaryEnabled: config.canaryEnabled,
  persistenceEnabled: config.persistenceEnabled,
});

startScheduler(config);
