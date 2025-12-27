import { Prisma } from '@prisma/client';
import { CanaryRunResponse } from '@magnus/deploy-guardian-contracts';
import { getPrismaClient } from '../client.js';

export async function fetchLatestCanary(): Promise<CanaryRunResponse | null> {
  const client = await getPrismaClient();
  if (!client) return null;

  try {
    const rows = await client.$queryRaw<
      Array<{ ok: boolean; results: unknown; created_at: Date }>
    >(Prisma.sql`
      select ok, results, created_at
      from guardian_canary_results
      order by created_at desc
      limit 1
    `);

    const row = rows[0];
    if (!row) return null;

    return CanaryRunResponse.parse({
      ok: row.ok,
      results: row.results,
    });
  } catch (error) {
    console.error('[guardian-api] fetchLatestCanary failed', error);
    return null;
  }
}
