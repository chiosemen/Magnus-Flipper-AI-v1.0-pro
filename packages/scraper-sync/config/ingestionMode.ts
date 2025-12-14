/**
 * Ingestion Mode Configuration
 * Controls whether the scraper runs in DB-lite (no writes) or DB-full mode
 */

export const INGESTION_MODE =
  process.env.INGESTION_MODE === 'db-lite'
    ? 'db-lite'
    : 'db-full';

export const IS_DB_LITE = INGESTION_MODE === 'db-lite';
