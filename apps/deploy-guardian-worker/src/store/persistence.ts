import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  Alert,
  CanaryRunResponse,
  IngestionRun,
  InvariantsEvaluateResponse,
  LatestResponse,
} from '@magnus/deploy-guardian-contracts';
import { getConfig } from '../config.js';

let client: PrismaClient | null = null;
let clientError: unknown | null = null;

async function getPrismaClient(): Promise<PrismaClient | null> {
  const config = getConfig();

  if (!config.persistenceEnabled || !process.env.DATABASE_URL) {
    return null;
  }

  if (client) return client;
  if (clientError) return null;

  try {
    const prismaModule = await import('@prisma/client');
    const PrismaClientCtor = prismaModule.PrismaClient;
    client = new PrismaClientCtor();
    return client;
  } catch (error) {
    clientError = error;
    console.error('[guardian-worker] prisma init failed', error);
    return null;
  }
}

export async function persistIngestion(runs: IngestionRun[], latest: LatestResponse[]) {
  const prisma = await getPrismaClient();
  if (!prisma) return;

  await Promise.all([
    ...runs.map((run) =>
      prisma.$executeRaw(
        Prisma.sql`
          insert into guardian_ingestion_runs
            (id, marketplace, started_at, ended_at, status, items, errors_count, meta)
          values
            (${run.id}, ${run.marketplace}, ${new Date(run.started_at)},
             ${run.ended_at ? new Date(run.ended_at) : null}, ${run.status},
             ${run.items}, ${run.errors_count}, ${JSON.stringify(run.meta ?? null)}::jsonb)
          on conflict do nothing
        `
      )
    ),
    ...latest.map((snapshot) =>
      prisma.$executeRaw(
        Prisma.sql`
          insert into guardian_latest_snapshots
            (marketplace, last_run_at, last_ok_at, last_error, lag_seconds)
          values
            (${snapshot.marketplace}, ${new Date(snapshot.last_run_at)},
             ${snapshot.last_ok_at ? new Date(snapshot.last_ok_at) : null},
             ${JSON.stringify(snapshot.last_error ?? null)}::jsonb,
             ${snapshot.lag_seconds})
          on conflict (marketplace)
          do update set
            last_run_at = excluded.last_run_at,
            last_ok_at = excluded.last_ok_at,
            last_error = excluded.last_error,
            lag_seconds = excluded.lag_seconds
        `
      )
    ),
  ]);
}

export async function persistInvariants(result: InvariantsEvaluateResponse) {
  const prisma = await getPrismaClient();
  if (!prisma) return;

  await prisma.$executeRaw(
    Prisma.sql`
      insert into guardian_invariant_results (ok, violations)
      values (${result.ok}, ${JSON.stringify(result.violations)}::jsonb)
    `
  );
}

export async function persistCanary(result: CanaryRunResponse) {
  const prisma = await getPrismaClient();
  if (!prisma) return;

  await prisma.$executeRaw(
    Prisma.sql`
      insert into guardian_canary_results (ok, results)
      values (${result.ok}, ${JSON.stringify(result.results)}::jsonb)
    `
  );
}

export async function persistAlert(alert: Alert) {
  const prisma = await getPrismaClient();
  if (!prisma) return;

  await prisma.$executeRaw(
    Prisma.sql`
      insert into guardian_alerts (id, severity, category, message, created_at, context)
      values (${alert.id}, ${alert.severity}, ${alert.category}, ${alert.message},
        ${new Date(alert.created_at)}, ${JSON.stringify(alert.context ?? null)}::jsonb)
      on conflict do nothing
    `
  );
}
