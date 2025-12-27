import { Prisma } from '@prisma/client';
import { IngestionRun, LatestResponse, Marketplace } from '@magnus/deploy-guardian-contracts';
import { getPrismaClient } from '../client.js';

export async function fetchLatestSnapshot(marketplace: Marketplace): Promise<LatestResponse | null> {
  const client = await getPrismaClient();
  if (!client) return null;

  try {
    const rows = await client.$queryRaw<
      Array<{
        marketplace: string;
        last_run_at: Date;
        last_ok_at: Date | null;
        last_error: unknown | null;
        lag_seconds: number;
      }>
    >(Prisma.sql`
      select marketplace, last_run_at, last_ok_at, last_error, lag_seconds
      from guardian_latest_snapshots
      where marketplace = ${marketplace}
      limit 1
    `);

    const row = rows[0];
    if (!row) return null;

    return LatestResponse.parse({
      marketplace: row.marketplace,
      last_run_at: row.last_run_at.toISOString(),
      last_ok_at: row.last_ok_at ? row.last_ok_at.toISOString() : null,
      last_error: row.last_error ?? null,
      lag_seconds: row.lag_seconds,
    });
  } catch (error) {
    console.error('[guardian-api] fetchLatestSnapshot failed', error);
    return null;
  }
}

export async function fetchIngestionRuns(
  marketplace: Marketplace,
  limit: number
): Promise<IngestionRun[] | null> {
  const client = await getPrismaClient();
  if (!client) return null;

  try {
    const rows = await client.$queryRaw<
      Array<{
        id: string;
        marketplace: string;
        started_at: Date;
        ended_at: Date | null;
        status: string;
        items: number;
        errors_count: number;
        meta: unknown | null;
      }>
    >(Prisma.sql`
      select id, marketplace, started_at, ended_at, status, items, errors_count, meta
      from guardian_ingestion_runs
      where marketplace = ${marketplace}
      order by started_at desc
      limit ${limit}
    `);

    return rows.map((row) =>
      IngestionRun.parse({
        id: row.id,
        marketplace: row.marketplace,
        started_at: row.started_at.toISOString(),
        ended_at: row.ended_at ? row.ended_at.toISOString() : null,
        status: row.status,
        items: row.items,
        errors_count: row.errors_count,
        meta: row.meta ?? null,
      })
    );
  } catch (error) {
    console.error('[guardian-api] fetchIngestionRuns failed', error);
    return null;
  }
}
